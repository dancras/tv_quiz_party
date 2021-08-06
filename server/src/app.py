import json
from flask import Flask, request

app = Flask(__name__)

lobby_index = 0
lobbies = {}

def next_lobby_id():
    global lobby_index
    lobby_index += 1
    return lobby_index

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/create_lobby', methods = ['POST'])
def create_lobby():
    global lobbies
    data = request.get_json()

    lobby_id = next_lobby_id()
    lobbies[lobby_id] = {
        'id': lobby_id,
        'host_id': data['host_id']
    }

    r = app.response_class(
        response = json.dumps(lobbies[lobby_id]),
        status = 201,
        mimetype = 'application/json'
    )
    r.headers['Location'] = "{}lobby/{}".format(request.root_url, lobby_id)
    return r

@app.route("/lobby/<lobby_id>")
def fetch_lobby(lobby_id):
    return app.response_class(
        response = json.dumps(lobbies[int(lobby_id)]),
        mimetype = 'application/json'
    )
    

if __name__ == "__main__":
    app.run(debug = True, host = '0.0.0.0')