import asyncio
from datetime import datetime, timedelta, timezone

from quart import request, g, websocket

from app import app
from questions import questions
import model
from response_helpers import error_response, linked_resource_response, json_response

LOBBY_URL = "{}lobby/{}"

all_lobby_queues = {}

async def broadcast(lobby_id, code, data):
    message = {
        'code': code,
        'data': data
    }

    for queue in all_lobby_queues[lobby_id].values():
        await queue.put(message)

@app.route('/create_lobby', methods = ['POST'])
async def create_lobby():
    global all_lobby_queues

    lobby = model.create_lobby(g.user_id)
    all_lobby_queues[lobby['id']] = {}

    return linked_resource_response(LOBBY_URL, 201, lobby['id'], lobby)

@app.route('/join_lobby', methods = ['POST'])
async def join_lobby():
    data = await request.get_json()
    join_code = int(data['join_code'])

    lobby = model.edit_lobby(join_code)

    if g.user_id in lobby['users']:
        return error_response(422, "User already in lobby")

    model.add_user_to_lobby(g.user_id, lobby)

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby['id'], 'USER_JOINED', {
        'user_id': g.user_id,
        'lobby': lobby
    }))

    return linked_resource_response(LOBBY_URL, 200, lobby['id'], lobby)


@app.route("/get_lobby/<join_code>")
async def fetch_lobby_by_join_code(join_code):
    try:
        return json_response(model.read_lobby(join_code=join_code))
    except KeyError:
        return error_response(404, 'join_code is incorrect or Lobby is closed')


@app.route("/lobby/<lobby_id>")
async def fetch_lobby(lobby_id):
    try:
        return json_response(model.read_lobby(lobby_id=lobby_id))
    except KeyError:
        return error_response(404, 'lobby_id is incorrect or Lobby is closed')


@app.route("/lobby/<lobby_id>/exit", methods = ['POST'])
async def exit_lobby(lobby_id):
    lobby = model.edit_lobby(lobby_id)

    loop = asyncio.get_event_loop()

    if lobby['host_id'] == g.user_id:
        loop.create_task(notify_lobby_closed(lobby['id']))
        model.delete_lobby(lobby['id'])
    else:
        model.remove_user_from_lobby(g.user_id, lobby)
        loop.create_task(notify_user_exited(g.user_id, lobby))

    return json_response({})

async def notify_user_exited(user_id, lobby):
    await broadcast(lobby['id'], 'USER_EXITED', {
        'user_id': user_id,
        'lobby': lobby
    })
    await broadcast(lobby['id'], 'RELEASE_USER', {
        'user_id': user_id,
    })


async def notify_lobby_closed(lobby_id):
    await broadcast(lobby_id, 'LOBBY_CLOSED', {})
    await broadcast(lobby_id, 'RELEASE_ALL', {})
    all_lobby_queues.pop(lobby_id)


@app.route("/lobby/<lobby_id>/start_round", methods = ['POST'])
async def start_round(lobby_id):
    lobby = model.edit_lobby(lobby_id)

    lobby['round'] = {
        'questions': questions,
        'answers': model.create_answers_store(lobby['users']),
        'leaderboard': model.create_leaderboard_store(lobby['users']),
    }

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby['id'], 'ROUND_STARTED', lobby['round']))

    return json_response({})

@app.route("/lobby/<lobby_id>/start_question", methods = ['POST'])
async def start_question(lobby_id):
    lobby = model.edit_lobby(lobby_id)
    data = await request.get_json()
    requested_question_index = int(data['question_index'])
    current_question = lobby['round'].get('current_question')

    try:
        message = 'first question must start with question_index 0'
        assert current_question is not None or requested_question_index == 0

        message = 'question_index must be the next in the sequence'
        assert current_question is None or requested_question_index == current_question['i'] + 1

        message = 'current question has not ended'
        assert current_question is None or current_question['has_ended']
    except AssertionError:
        return error_response(422, message)

    lobby['round']['current_question'] = {
        'i': requested_question_index,
        'start_time': (datetime.now(timezone.utc) + timedelta(seconds = 5)).timestamp(),
        'has_ended': False
    }

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby['id'], 'QUESTION_STARTED', lobby['round']['current_question']))

    return json_response({})


@app.route("/lobby/<lobby_id>/answer_question", methods = ['POST'])
async def answer_question(lobby_id):
    lobby = model.edit_lobby(lobby_id)
    data = await request.get_json()
    question_index = int(data['question_index'])
    answer = str(data['answer'])

    try:
        current_question_index = None
        current_question_index = lobby['round']['current_question']['i']
        assert current_question_index == question_index
        assert not lobby['round']['current_question']['has_ended']
    except (KeyError, AssertionError):
        message = 'Tried to answer question {}. Current question is {}'.format(question_index, current_question_index)
        return error_response(422, message)

    lobby['round']['answers'][g.user_id][question_index] = answer

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby['id'], 'ANSWER_RECEIVED', {
        'user_id': g.user_id,
        'question_index': question_index,
        'answer': answer
    }))

    return json_response({})


@app.route("/lobby/<lobby_id>/end_question", methods = ['POST'])
async def end_question(lobby_id):
    lobby = model.edit_lobby(lobby_id)
    data = await request.get_json()
    question_index = int(data['question_index'])
    round = lobby['round']

    try:
        current_question_index = round['current_question']['i']
        assert current_question_index == question_index
        assert not round['current_question']['has_ended']
    except (KeyError, AssertionError):
        return error_response(422, "Tried to end non-active or ended question")

    round['current_question']['has_ended'] = True

    for user_id in lobby['users']:
        user_answer = round['answers'][user_id].get(question_index)
        correct_answer = round['questions'][question_index]['correct_answer']

        if user_answer == correct_answer:
            round['leaderboard'][user_id]['score'] += 1

    model.update_leaderboard_positions(round['leaderboard'])

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby['id'], 'LEADERBOARD_UPDATED', round['leaderboard']))

    if len(round['questions']) == current_question_index + 1:
        lobby['previous_round'] = round
        lobby['round'] = None
        loop.create_task(broadcast(lobby['id'], 'ROUND_ENDED', round))

    return json_response({})


@app.websocket("/lobby/<lobby_id>/ws")
async def lobby_updates(lobby_id):
    lobby_id = int(lobby_id)

    try:
        current_lobby_queues = all_lobby_queues[lobby_id]

        await websocket.accept()

        try:
            existing_user_queue = current_lobby_queues[g.user_id]
            await existing_user_queue.put({
                'code': 'EXCHANGE_SOCKET',
                'data': {}
            })
        except KeyError:
            pass

        queue = asyncio.Queue()
        current_lobby_queues[g.user_id] = queue

        while True:
            data = await queue.get()

            if data['code'] in {'EXCHANGE_SOCKET', 'RELEASE_ALL'}:
                break

            if data['code'] == 'RELEASE_USER' and data['data']['user_id'] == g.user_id:
                current_lobby_queues.pop(g.user_id)
                break

            await websocket.send_json(data)

    except KeyError:
        pass
    except:
        current_lobby_queues.pop(g.user_id)
