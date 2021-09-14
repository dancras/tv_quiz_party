import asyncio
from datetime import datetime, timedelta, timezone

from quart import request, g, websocket

from app import app
from questions import questions
import model
from response_helpers import error_response, linked_resource_response, json_response

LOBBY_URL = "{}lobby/{}"

lobby_index = 0
lobbies = {}
all_lobby_queues = {}

def next_lobby_id():
    global lobby_index
    lobby_index += 1
    return lobby_index

async def broadcast(lobby_id, code, data):
    message = {
        'code': code,
        'data': data
    }

    for queue in all_lobby_queues[int(lobby_id)]:
        await queue.put(message)

@app.route('/create_lobby', methods = ['POST'])
async def create_lobby():
    global lobbies
    global all_lobby_queues

    lobby_id = next_lobby_id()
    lobbies[lobby_id] = {
        'id': lobby_id,
        'host_id': g.user_id,
        'join_code': lobby_id,
        'users': [g.user_id]
    }

    all_lobby_queues[lobby_id] = []

    return linked_resource_response(LOBBY_URL, 201, lobby_id, lobbies[lobby_id])

@app.route('/join_lobby', methods = ['POST'])
async def join_lobby():
    data = await request.get_json()
    join_code = data['join_code']

    lobby_data = lobbies[join_code]

    if g.user_id in lobby_data['users']:
        return error_response(422, "User already in lobby")

    lobby_data['users'].append(g.user_id)

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby_data['id'], 'USER_JOINED', {
        'user_id': g.user_id
    }))

    return linked_resource_response(LOBBY_URL, 200, lobby_data['id'], lobby_data)


@app.route("/lobby/<lobby_id>")
async def fetch_lobby(lobby_id):
    return json_response(lobbies[int(lobby_id)])

@app.route("/lobby/<lobby_id>/start_round", methods = ['POST'])
async def start_round(lobby_id):
    global lobbies
    lobbies[int(lobby_id)]['round'] = {
        'questions': questions,
        'start_time': (datetime.now(timezone.utc) + timedelta(seconds = 5)).timestamp(),
        'answers': model.create_answers_store(lobbies[int(lobby_id)]['users'])
    }

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby_id, 'ROUND_STARTED', lobbies[int(lobby_id)]['round']))

    return json_response({})

@app.route("/lobby/<lobby_id>/answer_question", methods = ['POST'])
async def answer_question(lobby_id):
    data = await request.get_json()
    question = str(data['question'])
    answer = str(data['answer'])

    global lobbies
    lobbies[int(lobby_id)]['round']['answers'][g.user_id][question] = answer

    loop = asyncio.get_event_loop()
    loop.create_task(broadcast(lobby_id, 'ANSWER_RECEIVED', {
        'user_id': g.user_id,
        'question': question,
        'answer': answer
    }))

    return json_response({})


@app.websocket("/lobby/<lobby_id>/ws")
async def lobby_updates(lobby_id):
    await websocket.accept()

    current_lobby_queues = all_lobby_queues[int(lobby_id)]
    queue = asyncio.Queue()
    current_lobby_queues.append(queue)

    while True:
        data = await queue.get()
        await websocket.send_json(data)

