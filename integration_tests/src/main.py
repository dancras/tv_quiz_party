import asyncio
from datetime import datetime, timezone
import json
import unittest

import aiohttp

class IntegrationTests(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.session = aiohttp.ClientSession()

    async def asyncTearDown(self):
        await self.session.close()

    async def test_functionality(self):
        response = await self.session.get("http://flask_backend:5000")
        self.assertEqual(response.status, 200)
    
    async def test_create_lobby(self):
        response = await self.session.post("http://flask_backend:5000/create_lobby")

        self.assertEqual(response.status, 201)

        response_data = await response.json()

        self.assertEqual(response.headers['Location'], "http://flask_backend:5000/lobby/{}".format(response_data['id']))
        self.assertEqual(response_data['host_id'], response.cookies['user_id'].value)

    async def set_up_lobby(self):
        response = await self.session.post("http://flask_backend:5000/create_lobby")
        return await response.json()

    async def test_get_lobby(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']
        lobby_host_id = lobby_data['host_id']

        response = await self.session.get("http://flask_backend:5000/lobby/{}".format(lobby_id))
        response_data = await response.json()

        self.assertEqual(response.status, 200)
        self.assertEqual(response_data['id'], lobby_id)
        self.assertEqual(response_data['host_id'], lobby_host_id)

    async def test_join_lobby_fails_when_already_joined(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }
        response = await self.session.post("http://flask_backend:5000/join_lobby", json=data)
        self.assertEqual(response.status, 422)

    async def test_join_lobby_adds_new_user(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }
        async with aiohttp.ClientSession() as other_session:
            response = await other_session.post("http://flask_backend:5000/join_lobby", json=data)
            self.assertEqual(response.status, 200)

            response_data = await response.json()
            self.assertEqual(response_data['join_code'], lobby_data['join_code'])
            self.assertIn(response.cookies['user_id'].value, response_data['users'])

            lobby_response = await other_session.get(response.headers['Location'])
            lobby_response_data = await lobby_response.json()
            self.assertEqual(response_data['join_code'], lobby_data['join_code'])
            self.assertIn(response.cookies['user_id'].value, lobby_response_data['users'])


    async def test_join_lobby_notifies_other_user(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }

        ws = await self.session.ws_connect("ws://flask_backend:5000/lobby/{}/ws".format(lobby_data['id']))
 
        other_user_id = None

        async with aiohttp.ClientSession() as other_session:
            response = await other_session.post("http://flask_backend:5000/join_lobby", json=data)
            self.assertEqual(response.status, 200)
            response.close()

            other_user_id = response.cookies['user_id'].value

        try:
            ws_message = json.loads((await asyncio.wait_for(ws.receive(), timeout=3)).data)

            self.assertEqual(ws_message['code'], 'USER_JOINED')
            self.assertEqual(ws_message['data'], {
                'user_id': other_user_id
            })
        except (asyncio.exceptions.TimeoutError):
            self.fail("No websocket message received")
        finally:
            await ws.close()

    async def test_start_round(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        ws = await self.session.ws_connect("ws://flask_backend:5000/lobby/{}/ws".format(lobby_id))

        response = await self.session.post("http://flask_backend:5000/lobby/{}/start_round".format(lobby_id))
        self.assertEqual(response.status, 200)
        response.close()

        try:
            ws_message = json.loads((await asyncio.wait_for(ws.receive(), timeout=3)).data)

            self.assertEqual(ws_message['code'], 'ROUND_STARTED')
            self.assertGreater(len(ws_message['data']['questions']), 0)

            time_now = datetime.now(timezone.utc)
            start_time = datetime.fromtimestamp(ws_message['data']['start_time'], timezone.utc)
            self.assertGreater(start_time, time_now)
        except (asyncio.exceptions.TimeoutError):
            self.fail("No websocket message received")
        finally:
            await ws.close()

        response = await self.session.get("http://flask_backend:5000/lobby/{}".format(lobby_id))
        response_data = await response.json()

        self.assertEqual(response.status, 200)
        self.assertEqual(response_data['round']['questions'], ws_message['data']['questions'])
        self.assertEqual(response_data['round']['start_time'], ws_message['data']['start_time'])


if __name__ == "__main__":
    unittest.main()
