import json

from quart import request, g

from app import app
import auth
from response_helpers import error_response

@app.before_request
async def manage_user_id():
    if "handshake" in request.path:
        return

    try:
        (_, user_id) = auth.authenticate_user(request.cookies.get('secret_token'))
    except (KeyError, ValueError):
        return error_response(403, "Handshake before using API")

    # https://github.com/PyCQA/pylint/issues/3793
    # pylint: disable=assigning-non-slot
    g.user_id = user_id


@app.route('/handshake', methods = ['POST'])
async def handshake():
    try:
        (_, user_id) = auth.authenticate_user(request.cookies.get('secret_token'))
    except (KeyError, ValueError):
        (new_secret_token, user_id) = auth.create_new_user()

    response = app.response_class(
        response = json.dumps({
            'user_id': user_id
        }),
        status = 200,
        mimetype = 'application/json'
    )

    if None != new_secret_token:
        response.set_cookie('secret_token', new_secret_token)

    return response
