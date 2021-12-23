import asyncio
import base64
from datetime import datetime, timezone
import json
import unittest

import aiohttp

from assertion_helpers import at_least_one_message
from request_helpers import new_handshook_session, handshake_session

BASE_URL = "http://flask_backend:5000"
HANDSHAKE_URL = "{}/handshake".format(BASE_URL)
UPDATE_PROFILE_URL = "{}/update_profile".format(BASE_URL)
PROFILE_IMAGES_CDN_URL = '{}/profile_images/{{}}'.format(BASE_URL)
CREATE_LOBBY_URL = "{}/create_lobby".format(BASE_URL)
JOIN_LOBBY_URL = "{}/join_lobby".format(BASE_URL)
GET_LOBBY_URL = "{}/get_lobby/{{}}".format(BASE_URL)
LOBBY_URL = "{}/lobby/{{}}".format(BASE_URL)
LOBBY_WS_URL = "{}/ws".format(LOBBY_URL).replace("http:", "ws:")
LOBBY_EXIT_URL = "{}/exit".format(LOBBY_URL)
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

    async def set_up_lobby(self):
        async with self.session.post(CREATE_LOBBY_URL) as response:
            return await response.json()

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

    async def test_update_profile(self):
        base64_image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        profile_data = {
            'display_name': 'David Bowie<>',
            'image_data_url': 'data:image/png;base64,{}'.format(base64_image)
        }

        response = await self.session.post(UPDATE_PROFILE_URL, json=profile_data)
        self.assertEqual(response.status, 200)

        update_profile_response_data = await response.json()
        display_name = update_profile_response_data['display_name']
        image_filename = update_profile_response_data['image_filename']
        self.assertEqual(display_name, 'David Bowie&lt;&gt;')

        async with self.session.get(PROFILE_IMAGES_CDN_URL.format(image_filename)) as img_response:
            img_data = await img_response.read()
            self.assertEqual(img_data, base64.b64decode(base64_image))

        handshake_response_data = await handshake_session(self.session)

        self.assertEqual(handshake_response_data['profile'], update_profile_response_data)

    async def test_create_lobby(self):
        response = await self.session.post(CREATE_LOBBY_URL)

        self.assertEqual(response.status, 201)

        response_data = await response.json()

        self.assertEqual(response.headers['Location'], LOBBY_URL.format(response_data['id']))
        self.assertEqual(response_data['host_id'], self.session_user_id)

    async def test_get_lobby_by_join_code(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']
        lobby_join_code = lobby_data['join_code']

        response = await self.session.get(GET_LOBBY_URL.format(lobby_join_code))
        response_data = await response.json()

        self.assertEqual(response.status, 200)
        self.assertEqual(response_data, lobby_data)

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

    async def test_exit_lobby_removes_second_user(self):
        lobby_data = await self.set_up_lobby()

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_data['id'])) as ws:

            join_data = {
                'join_code': lobby_data['join_code']
            }

            async with new_handshook_session() as (other_session, other_user_id):

                async with other_session.post(JOIN_LOBBY_URL, json=join_data):
                    pass

                async with other_session.post(LOBBY_EXIT_URL.format(lobby_data['id']), json={}) as response:
                    self.assertEqual(response.status, 200)

            def assert_user_exited_message(code, data):
                self.assertEqual(code, 'USER_EXITED')
                self.assertEqual(data['user_id'], other_user_id)
                self.assertEqual(data['lobby']['id'], lobby_data['id'])
                self.assertNotIn(other_user_id, data['lobby']['users'])

            _, message_data = await at_least_one_message(ws, assert_user_exited_message)

            response = await self.session.get(LOBBY_URL.format(lobby_data['id']))
            response_data = await response.json()

            self.assertEqual(response_data, message_data['lobby'])


    async def test_lobby_closes_when_host_exits(self):
        lobby_data = await self.set_up_lobby()

        async with new_handshook_session() as (other_session, other_user_id):

            join_data = {
                'join_code': lobby_data['join_code']
            }

            async with other_session.post(JOIN_LOBBY_URL, json=join_data):
                pass

            async with other_session.ws_connect(LOBBY_WS_URL.format(lobby_data['id'])) as ws:

                async with self.session.post(LOBBY_EXIT_URL.format(lobby_data['id']), json={}):
                    pass

                def assert_lobby_closed_message(code, data):
                    self.assertEqual(code, 'LOBBY_CLOSED')

                _, message_data = await at_least_one_message(ws, assert_lobby_closed_message)

        async with self.session.get(LOBBY_URL.format(lobby_data['id'])) as response:
            self.assertEqual(response.status, 404)


    async def test_handshake_data_includes_active_lobby_data(self):
        lobby_data = await self.set_up_lobby()
        handshake_data = await handshake_session(self.session)
        self.assertEqual(handshake_data['active_lobby']['id'], lobby_data['id'])

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


    async def test_start_question_fail_cases(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)) as response:
            pass

        def request_for_question(i):
            return {
                'question_index': i
            }

        # Must start with question 0
        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=request_for_question(1)) as response:
            self.assertEqual(response.status, 422)

        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=request_for_question(0)) as response:
            pass

        # Cannot start the same question twice
        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=request_for_question(0)) as response:
            self.assertEqual(response.status, 422)

        # Cannot start next without ending current
        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=request_for_question(1)) as response:
            self.assertEqual(response.status, 422)

        async with self.session.post(LOBBY_END_QUESTION_URL.format(lobby_id), json=request_for_question(0)) as response:
            pass

        # Must start questions in sequence
        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=request_for_question(2)) as response:
            self.assertEqual(response.status, 422)

        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=request_for_question(1)) as response:
            pass

        # Cannot start previous question
        async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=request_for_question(0)) as response:
            self.assertEqual(response.status, 422)


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

    async def test_end_question_updates_scores_and_positions(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_id)) as ws:

            async with new_handshook_session() as (other_session, other_user_id):
                join_data = {
                    'join_code': lobby_data['join_code']
                }

                async with other_session.post(JOIN_LOBBY_URL, json=join_data):
                    pass

                async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)):
                    pass

                def assert_leaderboard_correct_at_start(code, data):
                    self.assertEqual(code, 'ROUND_STARTED')
                    self.assertEqual(data['leaderboard'][self.session_user_id]['score'], 0)
                    self.assertEqual(data['leaderboard'][self.session_user_id]['position'], 1)
                    self.assertEqual(data['leaderboard'][other_user_id]['score'], 0)
                    self.assertEqual(data['leaderboard'][other_user_id]['position'], 1)

                (_, message_data) = await at_least_one_message(ws, assert_leaderboard_correct_at_start)

                question_index_data = {
                    'question_index': 0
                }

                async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=question_index_data) as response:
                    self.assertEqual(response.status, 200)

                correct_answer_data = {
                    'question_index': 0,
                    'answer': message_data['questions'][0]['correct_answer']
                }

                wrong_answer_data = {
                    'question_index': 0,
                    'answer': 'foo'
                }

                answer_url = LOBBY_ANSWER_QUESTION_URL.format(lobby_id)

                async with self.session.post(answer_url, json=wrong_answer_data) as response:
                    pass

                async with other_session.post(answer_url, json=correct_answer_data) as response:
                    pass

                async with self.session.post(LOBBY_END_QUESTION_URL.format(lobby_id), json=question_index_data) as response:
                    pass

                def assert_leaderboard_updated_correctly(code, data):
                    self.assertEqual(code, 'LEADERBOARD_UPDATED')
                    self.assertEqual(data[self.session_user_id]['score'], 0)
                    self.assertEqual(data[self.session_user_id]['position'], 2)
                    self.assertEqual(data[other_user_id]['score'], 1)
                    self.assertEqual(data[other_user_id]['position'], 1)

                await at_least_one_message(ws, assert_leaderboard_updated_correctly)

    async def test_end_question_ends_round_after_final_question(self):
        lobby_data = await self.set_up_lobby()
        lobby_id = lobby_data['id']

        async with self.session.ws_connect(LOBBY_WS_URL.format(lobby_id)) as ws:

            async with self.session.post(LOBBY_START_ROUND_URL.format(lobby_id)):
                pass

            def assert_round_started_message(code, data):
                self.assertEqual(code, 'ROUND_STARTED')

            _, message_data = await at_least_one_message(ws, assert_round_started_message)

            for i in range(len(message_data['questions'])):
                question_index_data = {
                    'question_index': i
                }

                async with self.session.post(LOBBY_START_QUESTION_URL.format(lobby_id), json=question_index_data) as response:
                    pass

                async with self.session.post(LOBBY_END_QUESTION_URL.format(lobby_id), json=question_index_data) as response:
                    pass

            def assert_round_ended_message(code, _):
                self.assertEqual(code, 'ROUND_ENDED')

            await at_least_one_message(ws, assert_round_ended_message)

            response = await self.session.get(LOBBY_URL.format(lobby_id))
            response_data = await response.json()

            self.assertIsNone(response_data['round'])
            self.assertEqual(response_data['previous_round']['leaderboard'][self.session_user_id]['score'], 0)


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

            try:
                await asyncio.wait_for(ws1.receive(), timeout=3)
                self.assertEqual(ws1.closed, True)
            except (asyncio.exceptions.TimeoutError):
                self.fail("Websocket was not closed as expected")

if __name__ == "__main__":
    unittest.main()
