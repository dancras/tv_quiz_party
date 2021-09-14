import json

from quart import request, g, websocket
from app import app

def json_response(data):
    return app.response_class(
        response = json.dumps(data),
        mimetype = 'application/json'
    )


def error_response(response_code, message):
    return app.response_class(
        response = json.dumps({
            'message': message
        }),
        status = response_code,
        mimetype = 'application/json'
    )


def linked_resource_response(resource_url, response_code, resource_id, resource_data):
    r = app.response_class(
        response = json.dumps(resource_data),
        status = response_code,
        mimetype = 'application/json'
    )
    r.headers['Location'] = resource_url.format(request.root_url, resource_id)
    return r
