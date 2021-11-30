import json

from quart import request, websocket, g

from app import app
import auth
from model import get_user_lobby
from response_helpers import error_response


@app.before_websocket
async def ws_manage_user_id():
    return add_authenticated_user_to_global_context(websocket)


@app.before_request
async def manage_user_id():
    if "handshake" in request.path:
        return

    return add_authenticated_user_to_global_context(request)


def add_authenticated_user_to_global_context(context):
    try:
        (_, user_id) = auth.authenticate_user(context.cookies.get('secret_token'))
    except (KeyError, ValueError):
        return error_response(403, "Handshake before using API")

    # https://github.com/PyCQA/pylint/issues/3793
    # pylint: disable=assigning-non-slot
    g.user_id = user_id


@app.route('/handshake', methods = ['POST'])
async def handshake():
    try:
        (_, user_id) = auth.authenticate_user(request.cookies.get('secret_token'))
        new_secret_token = None
    except (KeyError, ValueError):
        (new_secret_token, user_id) = auth.create_new_user()

    response = app.response_class(
        response = json.dumps({
            'user_id': user_id,
            'active_lobby': get_user_lobby(user_id)
        }),
        status = 200,
        mimetype = 'application/json'
    )

    if new_secret_token is not None:
        response.set_cookie('secret_token', new_secret_token)

    return response
