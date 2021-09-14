from quart import Quart

app = Quart(__name__)

@app.route("/")
async def hello_world():
    return "<p>Hello, World!</p>"
