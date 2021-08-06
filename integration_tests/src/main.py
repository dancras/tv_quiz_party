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


if __name__ == "__main__":
    unittest.main()