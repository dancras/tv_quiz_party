def create_answers_store(user_ids):
    return dict((user_id, {}) for user_id in user_ids)

def create_leaderboard_store(user_ids):
    return dict((user_id, new_leaderboard_item()) for user_id in user_ids)

def new_leaderboard_item():
    return {'score': 0}

def add_user_to_lobby(user_id, lobby):
    lobby['users'].append(user_id)

    try:
        lobby['round']['leaderboard'][user_id] = new_leaderboard_item()
    except KeyError:
        pass
