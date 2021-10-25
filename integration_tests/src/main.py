import asyncio
from datetime import datetime, timezone
import json
import unittest

import aiohttp

from assertion_helpers import at_least_one_message
from request_helpers import new_handshook_session, handshake_session

BASE_URL = "http://flask_backend:5000"
HANDSHAKE_URL = "{}/handshake".format(BASE_URL)
CREATE_LOBBY_URL = "{}/create_lobby".format(BASE_URL)
JOIN_LOBBY_URL = "{}/join_lobby".format(BASE_URL)
LOBBY_URL = "{}/lobby/{{}}".format(BASE_URL)
LOBBY_WS_URL = "{}/ws".format(LOBBY_URL).replace("http:", "ws:")
LOBBY_START_ROUND_URL = "{}/start_round".format(LOBBY_URL)
LOBBY_START_QUESTION_URL = "{}/start_question".format(LOBBY_URL)
LOBBY_END_QUESTION_URL = "{}/end_question".format(LOBBY_URL)
LOBBY_ANSWER_QUESTION_URL = "{}/answer_question".format(LOBBY_URL)


class IntegrationTests(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.session = aiohttp.ClientSession()
        handshake_data = await handshake_session(self.session)
        self.session_user_id = handshake_data['user_id']

    async def asyncTearDown(self):
        await self.session.close()

    async def test_user_token_and_id_created(self):
        async with aiohttp.ClientSession() as new_session:
            response = await new_session.post(HANDSHAKE_URL, json={})
            response_data = await response.json()

            self.assertIsNotNone(response.cookies['secret_token'].value)
            self.assertIsNotNone(response_data['user_id'])

    async def test_invalid_user_token_ignored(self):
        async with aiohttp.ClientSession() as new_session:
            cookies = {
                'secret_code': 'foo'
            }
            async with new_session.post(HANDSHAKE_URL, json={}, cookies=cookies) as response:
                self.assertEqual(response.status, 200)

    async def test_authorization_fails_without_handshake(self):
        async with aiohttp.ClientSession() as new_session:
            async with new_session.get(BASE_URL) as response:
                self.assertEqual(response.status, 403)

            async with new_session.post(HANDSHAKE_URL, json={}) as _:
                pass

            async with new_session.get(BASE_URL) as response:
                self.assertEqual(response.status, 200)


    async def test_create_lobby(self):
        response = await self.session.post(CREATE_LOBBY_URL)

        self.assertEqual(response.status, 201)

        response_data = await response.json()

        self.assertEqual(response.headers['Location'], LOBBY_URL.format(response_data['id']))
        self.assertEqual(response_data['host_id'], self.session_user_id)

    async def set_up_lobby(self):
        async with self.session.post(CREATE_LOBBY_URL) as response:
            return await response.json()

    async def test_get_lobby(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']
        lobby_host_id = lobby_data['host_id']

        response = await self.session.get(LOBBY_URL.format(lobby_id))
        response_data = await response.json()

        self.assertEqual(response.status, 200)
        self.assertEqual(response_data['id'], lobby_id)
        self.assertEqual(response_data['host_id'], lobby_host_id)

    async def test_join_lobby_fails_when_already_joined(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }
        response = await self.session.post(JOIN_LOBBY_URL, json=data)
        self.assertEqual(response.status, 422)

    async def test_join_lobby_adds_new_user(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }

        async with new_handshook_session() as (other_session, user_id):
            response = await other_session.post(JOIN_LOBBY_URL, json=data)
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

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_data['id'])) as ws:

            async with new_handshook_session() as (other_session, other_user_id):

                async with other_session.post(JOIN_LOBBY_URL, json=data) as response:
                    self.assertEqual(response.status, 200)

                try:
                    ws_message = json.loads((await asyncio.wait_for(ws.receive(), timeout=3)).data)

                    self.assertEqual(ws_message['code'], 'USER_JOINED')
                    self.assertEqual(ws_message['data']['user_id'], other_user_id)
                except (asyncio.exceptions.TimeoutError):
                    self.fail("No websocket message received")


    async def test_start_round(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_id)) as ws:

            async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)) as response:
                self.assertEqual(response.status, 200)

            def assert_round_started_message(code, data):
                self.assertEqual(code, 'ROUND_STARTED')
                self.assertGreater(len(data['questions']), 0)
                self.assertEqual(data['leaderboard'][self.session_user_id]['score'], 0)

            _, message_data = await at_least_one_message(ws, assert_round_started_message)

            response = await self.session.get(LOBBY_URL.format(lobby_id))
            response_data = await response.json()

            self.assertEqual(response.status, 200)
            self.assertEqual(response_data['round']['questions'], message_data['questions'])
            self.assertEqual(response_data['round']['leaderboard'][self.session_user_id]['score'], 0)


    async def test_start_question(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_id)) as ws:

            async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)) as response:
                pass

            data = {
                'question_index': 0
            }

            async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=data) as response:
                self.assertEqual(response.status, 200)

            def assert_question_started_message(code, data):
                self.assertEqual(code, 'QUESTION_STARTED')
                self.assertEqual(data['i'], 0)

                time_now = datetime.now(timezone.utc)
                start_time = datetime.fromtimestamp(data['start_time'], timezone.utc)
                self.assertGreater(start_time, time_now)

            _, message_data = await at_least_one_message(ws, assert_question_started_message)

            response = await self.session.get(LOBBY_URL.format(lobby_id))
            response_data = await response.json()

            self.assertEqual(response.status, 200)
            self.assertEqual(response_data['round']['current_question']['i'], 0)
            self.assertEqual(response_data['round']['current_question']['start_time'], message_data['start_time'])


    async def test_answer_question_updates_lobby(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_id)) as ws:

            async with new_handshook_session() as (other_session, user_id):
                join_data = {
                    'join_code': lobby_data['join_code']
                }

                async with other_session.post(JOIN_LOBBY_URL, json=join_data):
                    pass

            async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)):
                pass

            data = {
                'question_index': 0
            }

            async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=data) as response:
                self.assertEqual(response.status, 200)

            answer_url = LOBBY_ANSWER_QUESTION_URL.format(lobby_id)
            answer_data = {
                'question_index': 0,
                'answer': 3
            }
            async with self.session.post(answer_url, json=answer_data) as response:
                self.assertEqual(response.status, 200)

            def assert_message_contains_answer(code, data):
                self.assertEqual(code, 'ANSWER_RECEIVED')

            (_, message_data) = await at_least_one_message(ws, assert_message_contains_answer)
            self.assertEqual(message_data['user_id'], self.session_user_id)
            self.assertEqual(message_data['question_index'], 0)
            self.assertEqual(message_data['answer'], '3')

            response = await self.session.get(LOBBY_URL.format(lobby_id))
            response_data = await response.json()

            self.assertEqual(response.status, 200)
            self.assertEqual(response_data['round']['answers'][self.session_user_id]['0'], '3')


    async def test_answer_question_fails_for_inactive_question(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)) as response:
            pass

        data = {
            'question_index': 0
        }

        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=data) as response:
            self.assertEqual(response.status, 200)

        answer_url = LOBBY_ANSWER_QUESTION_URL.format(lobby_id)
        answer_data = {
            'question_index': 1,
            'answer': 3
        }
        async with self.session.post(answer_url, json=answer_data) as response:
            self.assertEqual(response.status, 422)


    async def test_answer_question_fails_after_host_ends_question(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)) as response:
            pass

        data = {
            'question_index': 0
        }

        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=data) as response:
            self.assertEqual(response.status, 200)

        async with self.session.post(LOBBY_END_QUESTION_URL.format(lobby_id), json=data) as response:
            self.assertEqual(response.status, 200)

        answer_data = {
            'question_index': 0,
            'answer': 3
        }
        async with self.session.post(LOBBY_ANSWER_QUESTION_URL.format(lobby_id), json=answer_data) as response:
            self.assertEqual(response.status, 422)


    async def test_host_can_only_end_current_question_and_only_once(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)) as response:
            pass

        data = {
            'question_index': 0
        }

        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=data) as response:
            self.assertEqual(response.status, 200)

        invalid_data = {
            'question_index': 1
        }

        async with self.session.post(LOBBY_END_QUESTION_URL.format(lobby_id), json=invalid_data) as response:
            self.assertEqual(response.status, 422)

        async with self.session.post(LOBBY_END_QUESTION_URL.format(lobby_id), json=data) as response:
            pass

        async with self.session.post(LOBBY_END_QUESTION_URL.format(lobby_id), json=data) as response:
            self.assertEqual(response.status, 422)


    async def test_leaderboard_players_are_maintained(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_id)) as ws:

            async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)) as response:
                self.assertEqual(response.status, 200)

            async with new_handshook_session() as (other_session, other_user_id):

                join_request_data = {
                    'join_code': lobby_data['join_code']
                }

                async with other_session.post(JOIN_LOBBY_URL, json=join_request_data) as response:
                    pass

                def assert_user_joined_and_added_to_leaderboard(code, data):
                    self.assertEqual(code, 'USER_JOINED')
                    self.assertEqual(data['lobby']['round']['leaderboard'][other_user_id]['score'], 0)

                await at_least_one_message(ws, assert_user_joined_and_added_to_leaderboard)

                response = await self.session.get(LOBBY_URL.format(lobby_id))
                response_data = await response.json()

                self.assertEqual(response.status, 200)
                self.assertEqual(response_data['round']['leaderboard'][other_user_id]['score'], 0)

    async def test_websocket_connection_after_reconnect(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_data['id'])) as ws:
            pass

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_data['id'])) as ws:
            async with new_handshook_session() as (other_session, other_user_id):

                async with other_session.post(JOIN_LOBBY_URL, json=data) as response:
                    self.assertEqual(response.status, 200)

                try:
                    ws_message = json.loads((await asyncio.wait_for(ws.receive(), timeout=3)).data)

                    self.assertEqual(ws_message['code'], 'USER_JOINED')
                    self.assertEqual(ws_message['data']['user_id'], other_user_id)
                except (asyncio.exceptions.TimeoutError):
                    self.fail("No websocket message received")


    async def test_opening_second_websocket_closes_first(self):
        lobby_data = await self.set_up_lobby()
        data = {
            'join_code': lobby_data['join_code']
        }

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_data['id'])) as ws1:

            async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_data['id'])) as ws2:
                async with new_handshook_session() as (other_session, other_user_id):

                    async with other_session.post(JOIN_LOBBY_URL, json=data) as response:
                        self.assertEqual(response.status, 200)

                    try:
                        ws_message = json.loads((await asyncio.wait_for(ws2.receive(), timeout=3)).data)

                        self.assertEqual(ws_message['code'], 'USER_JOINED')
                        self.assertEqual(ws_message['data']['user_id'], other_user_id)
                    except (asyncio.exceptions.TimeoutError):
                        self.fail("No websocket message received")

            def assert_websocket_replaced(code, data):
                self.assertEqual(code, 'SOCKET_REPLACED')

            await at_least_one_message(ws1, assert_websocket_replaced)



if __name__ == "__main__":
    unittest.main()
