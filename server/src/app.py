import uuid
from quart import Quart, request, g, after_this_request

app = Quart(__name__)

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
