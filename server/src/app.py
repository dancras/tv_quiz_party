import json
import uuid
from quart import Quart, request, g, after_this_request

app = Quart(__name__)

lobby_index = 0
lobbies = {}

def next_lobby_id():
    global lobby_index
    lobby_index += 1
    return lobby_index

@app.before_request
async def manage_user_id():
    user_id = None

    try:
        user_id = str(uuid.UUID(request.cookies.get('user_id'), version=4))
    except (TypeError, ValueError):
        pass

    if None == user_id:
        user_id = str(uuid.uuid4())

        @after_this_request
        def set_user_id_cookie(response):
            response.set_cookie('user_id', user_id)
            return response

    # https://github.com/PyCQA/pylint/issues/3793
    # pylint: disable=assigning-non-slot
    g.user_id = user_id

@app.route("/")
async def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/create_lobby', methods = ['POST'])
async def create_lobby():
    global lobbies

    lobby_id = next_lobby_id()
    lobbies[lobby_id] = {
        'id': lobby_id,
        'host_id': g.user_id,
        'join_code': lobby_id,
        'users': [g.user_id]
    }

    r = app.response_class(
        response = json.dumps(lobbies[lobby_id]),
        status = 201,
        mimetype = 'application/json'
    )
    r.headers['Location'] = "{}lobby/{}".format(request.root_url, lobby_id)
    return r

@app.route('/join_lobby', methods = ['POST'])
async def join_lobby():
    global lobbies
    data = await request.get_json()
    join_code = data['join_code']

    lobby_data = lobbies[join_code]

    if g.user_id in lobby_data['users']:
        return app.response_class(
            response = json.dumps({
                'message': "User already in lobby"
            }),
            status = 422,
            mimetype = 'application/json'
        )

    lobby_data['users'].append(g.user_id)

    r = app.response_class(
        response = json.dumps(lobby_data),
        status = 200,
        mimetype = 'application/json'
    )
    r.headers['Location'] = "{}lobby/{}".format(request.root_url, lobby_data['id'])
    return r

@app.route("/lobby/<lobby_id>")
async def fetch_lobby(lobby_id):
    return app.response_class(
        response = json.dumps(lobbies[int(lobby_id)]),
        mimetype = 'application/json'
    )
    

if __name__ == "__main__":
    app.run(debug = True, host = '0.0.0.0')
