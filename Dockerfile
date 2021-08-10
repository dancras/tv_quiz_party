FROM python:3.9.6

COPY ./requirements.txt /app/requirements.txt

RUN pip install -r /app/requirements.txt

CMD ["sleep", "infinity"]
