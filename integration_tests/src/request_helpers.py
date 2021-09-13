import aiohttp

class HandshookSessionContextManager():
    def __init__(self, session):
        self.session = session

    async def __aenter__(self):
        session = await self.session.__aenter__()
        handshake_data = await handshake_session(session)
        return (session, handshake_data['user_id'])

    async def __aexit__(self, exc_type, exc, tb):
        await self.session.__aexit__(exc_type, exc, tb)


async def handshake_session(session):
    headers = {"Connection": "close"}
    async with session.post("http://flask_backend:5000/handshake", json={}, headers=headers) as response:
        return await response.json()


def new_handshook_session():
    return HandshookSessionContextManager(aiohttp.ClientSession())

def cookie_value_by_name(name, cookie_jar):
    for cookie in cookie_jar:
        if cookie.key == name:
            return cookie.value