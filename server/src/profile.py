import aiofiles
import html
import base64
import uuid
from quart import request, g, send_from_directory
from response_helpers import json_response
from model import update_profile, get_profile

PROFILE_IMAGES_PATH = '/profile_images/{}'

from app import app

@app.route('/update_profile', methods = ['POST'])
async def handle_update_profile():
    data = await request.get_json()
    display_name = html.escape(data['display_name'])
    image_data_url = data['image_data_url']
    data_url_parts = image_data_url.split(',')
    image_data = base64.b64decode(data_url_parts[1])
    unique_filename = '{}.png'.format(str(uuid.uuid4()))

    async with aiofiles.open(PROFILE_IMAGES_PATH.format(unique_filename), mode='wb') as file:
        await file.write(image_data)

    update_profile(g.user_id, display_name, unique_filename)

    return json_response(get_profile(g.user_id))

@app.route('/profile_images/<path:filename>')
async def get_profile_image(filename):
    return await send_from_directory(PROFILE_IMAGES_PATH.format(''), filename)
