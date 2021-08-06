import asyncio
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
        data = {
            'host_id': 'FAKEHOST'
        }
        response = await self.session.post("http://flask_backend:5000/create_lobby", json=data)
        response_data = await response.json()

        self.assertEqual(response.status, 201)
        self.assertEqual(response.headers['Location'], "http://flask_backend:5000/lobby/{}".format(response_data['id']))
        self.assertEqual(response_data['host_id'], 'FAKEHOST')

    async def set_up_lobby(self):
        data = {
            'host_id': 'FAKEHOST',
        }
        response = await self.session.post("http://flask_backend:5000/create_lobby", json=data)
        response_data = await response.json()
        return response_data['id']

    async def test_get_lobby(self):
        lobby_id = await self.set_up_lobby()
        response = await self.session.get("http://flask_backend:5000/lobby/{}".format(lobby_id))
        response_data = await response.json()

        self.assertEqual(response.status, 200)
        self.assertEqual(response_data['id'], lobby_id)
        self.assertEqual(response_data['host_id'], 'FAKEHOST')


if __name__ == "__main__":
    unittest.main()