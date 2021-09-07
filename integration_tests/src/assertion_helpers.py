import asyncio
import json

async def at_least_one_message(ws, assert_func):
    assertion_errors = []

    while True:
        try:
            ws_message = json.loads((await asyncio.wait_for(ws.receive(), timeout=3)).data)
            assert_func(ws_message['code'], ws_message['data'])
            return (ws_message['code'], ws_message['data'])
        except AssertionError as e:
            assertion_errors.append(e)
        except asyncio.exceptions.TimeoutError as e:
            if len(assertion_errors) > 0:
                raise AssertionError(assertion_errors)
            else:
                raise AssertionError("No websocket message received")