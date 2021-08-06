FROM python:alpine

COPY ./requirements.txt /app/server/requirements.txt

RUN pip install -r /app/server/requirements.txt

ENTRYPOINT ["python", "/app/server/src/app.py"]