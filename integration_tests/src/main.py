import asyncio
from datetime import datetime, timezone
import json
import unittest

import aiohttp

from assertion_helpers import at_least_one_message
from request_helpers import new_handshook_session, handshake_session

class IntegrationTests(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.session = aiohttp.ClientSession()
        handshake_data = await handshake_session(self.session)
        self.session_user_id = handshake_data['user_id']

    async def asyncTearDown(self):
        await self.session.close()

    async def test_user_token_and_id_created(self):
        async with aiohttp.ClientSession() as new_session:
            response = await new_session.post("http://flask_backend:5000/handshake", json={})
            response_data = await response.json()

            self.assertIsNotNone(response.cookies['secret_token'].value)
            self.assertIsNotNone(response_data['user_id'])

    async def test_invalid_user_token_ignored(self):
        async with aiohttp.ClientSession() as new_session:
            cookies = {
                'secret_code': 'foo'
            }
            async with new_session.post("http://flask_backend:5000/handshake", json={}, cookies=cookies) as response:
                self.assertEqual(response.status, 200)

    async def test_authorization_fails_without_handshake(self):
        async with aiohttp.ClientSession() as new_session:
            async with new_session.get("http://flask_backend:5000") as response:
                self.assertEqual(response.status, 403)

            async with new_session.post("http://flask_backend:5000/handshake", json={}) as _:
                pass

            async with new_session.get("http://flask_backend:5000") as response:
                self.assertEqual(response.status, 200)


    async def test_create_lobby(self):
        response = await self.session.post("http://flask_backend:5000/create_lobby")

        self.assertEqual(response.status, 201)

        response_data = await response.json()

        self.assertEqual(response.headers['Location'], "http://flask_backend:5000/lobby/{}".format(response_data['id']))
        self.assertEqual(response_data['host_id'], self.session_user_id)

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

        async with new_handshook_session() as (other_session, user_id):
            response = await other_session.post("http://flask_backend:5000/join_lobby", json=data)
            self.assertEqual(response.status, 200)

            response_data = await response.json()
            self.assertEqual(response_data['join_code'], lobby_data['join_code'])
            self.assertIn(user_id, response_data['users'])

            lobby_response = await other_session.get(response.headers['Location'])
            lobby_response_data = await lobby_response.json()
            self.assertEqual(response_data['join_code'], lobby_data['join_code'])
            self.assertIn(user_id, lobby_response_data['users'])


    async def test_join_lobby_notifies_other_user(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }

        async with self.session.ws_connect("ws://flask_backend:5000/lobby/{}/ws".format(lobby_data['id'])) as ws:

            async with new_handshook_session() as (other_session, user_id):
                response = await other_session.post("http://flask_backend:5000/join_lobby", json=data)
                self.assertEqual(response.status, 200)
                response.close()

                other_user_id = user_id

            try:
                ws_message = json.loads((await asyncio.wait_for(ws.receive(), timeout=3)).data)

                self.assertEqual(ws_message['code'], 'USER_JOINED')
                self.assertEqual(ws_message['data'], {
                    'user_id': other_user_id
                })
            except (asyncio.exceptions.TimeoutError):
                self.fail("No websocket message received")


    async def test_start_round(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect("ws://flask_backend:5000/lobby/{}/ws".format(lobby_id)) as ws:

            async with self.session.post("http://flask_backend:5000/lobby/{}/start_round".format(lobby_id)) as response:
                self.assertEqual(response.status, 200)

            def assert_round_started_message(code, data):
                self.assertEqual(code, 'ROUND_STARTED')
                self.assertGreater(len(data['questions']), 0)

                time_now = datetime.now(timezone.utc)
                start_time = datetime.fromtimestamp(data['start_time'], timezone.utc)
                self.assertGreater(start_time, time_now)

            _, message_data = await at_least_one_message(ws, assert_round_started_message)

            response = await self.session.get("http://flask_backend:5000/lobby/{}".format(lobby_id))
            response_data = await response.json()

            self.assertEqual(response.status, 200)
            self.assertEqual(response_data['round']['questions'], message_data['questions'])
            self.assertEqual(response_data['round']['start_time'], message_data['start_time'])


    async def test_answer_question_updates_lobby(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect("ws://flask_backend:5000/lobby/{}/ws".format(lobby_id)) as ws:

            async with new_handshook_session() as (other_session, user_id):
                join_data = {
                    'join_code': lobby_data['join_code']
                }

                async with other_session.post("http://flask_backend:5000/join_lobby", json=join_data):
                    pass

            async with self.session.post("http://flask_backend:5000/lobby/{}/start_round".format(lobby_id)):
                pass

            answer_url = "http://flask_backend:5000/lobby/{}/answer_question".format(lobby_id)
            answer_data = {
                'question': 1,
                'answer': 3
            }
            async with self.session.post(answer_url, json=answer_data) as response:
                self.assertEqual(response.status, 200)

            def assert_message_contains_answer(code, data):
                self.assertEqual(code, 'ANSWER_RECEIVED')

            (_, message_data) = await at_least_one_message(ws, assert_message_contains_answer)
            self.assertEqual(message_data['user_id'], self.session_user_id)
            self.assertEqual(message_data['question'], '1')
            self.assertEqual(message_data['answer'], '3')

            response = await self.session.get("http://flask_backend:5000/lobby/{}".format(lobby_id))
            response_data = await response.json()

            self.assertEqual(response.status, 200)
            self.assertEqual(response_data['round']['answers'][self.session_user_id]['1'], '3')


if __name__ == "__main__":
    unittest.main()
