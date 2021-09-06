import uuid

secret_token_user_id_map = {}

def create_new_user():
    secret_token = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    secret_token_user_id_map[secret_token] = user_id
    return (secret_token, user_id)

def authenticate_user(secret_token):
    return (secret_token, secret_token_user_id_map[secret_token])
