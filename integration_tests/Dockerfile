FROM python:3.9.6

COPY ./requirements.txt /app/integration_tests/requirements.txt

RUN pip install -r /app/integration_tests/requirements.txt

ENTRYPOINT ["python", "/app/integration_tests/src/main.py"]