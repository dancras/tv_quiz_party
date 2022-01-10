# Server Development

Open the `server` directory in VS Code with `code server`.

Reopen directory in container from within VS Code (bottom left).

Use VS Code terminal for all console operations unless stated otherwise.

Quart hot reload currently crashing on save. Restart server from Host after making changes:

`docker-compose up -d` (Host)

Rebuild the backend machine if python dependencies change:

`docker-compose build flask_backend` (Host)


## Testing

Run unit tests with:

`python server/unit_tests/main.py`


Run integration tests with:

`python integration_tests/src/main.py`


Run the integration tests from Host machine using:

`docker-compose run integration_tests` (Host)

Rebuild the integration tests machine if python dependencies change:

`docker-compose build integration_tests` (Host)