lobby_index = 0
lobbies = {}
profiles = {}

def next_lobby_id():
    global lobby_index
    lobby_index += 1
    return lobby_index

def create_lobby(host_id):
    lobby_id = next_lobby_id()
    lobbies[lobby_id] = {
        'id': lobby_id,
        'host_id': host_id,
        'join_code': lobby_id,
        'users': {
            host_id: get_profile(host_id)
        },
        'v': 1
    }
    return lobbies[lobby_id]

def read_lobby(lobby_id=None, join_code=None):
    if lobby_id is not None:
        return lobbies[int(lobby_id)]
    else:
        return lobbies[int(join_code)]

def edit_lobby(id_or_join_code):
    lobby = lobbies[int(id_or_join_code)]
    lobby['v'] += 1
    return lobby

def delete_lobby(lobby_id):
    del lobbies[int(lobby_id)]

def get_user_lobby(user_id):
    for lobby_id in lobbies:
        lobby = lobbies[lobby_id]
        if user_id in lobby['users']:
            return lobby

def create_answers_store(user_ids):
    return dict((user_id, {}) for user_id in user_ids)

def create_leaderboard_store(user_ids):
    return dict((user_id, new_leaderboard_item()) for user_id in user_ids)

def new_leaderboard_item():
    return {
        'score': 0,
        'position': 1
    }

def update_leaderboard_positions(leaderboard):
    scores = list(set(map(lambda x : x['score'], leaderboard.values())))
    scores.reverse()

    for user_id in leaderboard:
        score = leaderboard[user_id]['score']
        leaderboard[user_id]['position'] = scores.index(score) + 1


def add_user_to_lobby(user_id, lobby):
    lobby['users'][user_id] = get_profile(user_id)

    try:
        lobby['round']['leaderboard'][user_id] = new_leaderboard_item()
    except KeyError:
        pass

def remove_user_from_lobby(user_id, lobby):
    try:
        del lobby['users'][user_id]
    except KeyError:
        pass

def update_profile(user_id, display_name, image_filename):
    profiles[user_id] = {
        'user_id': user_id,
        'display_name': display_name,
        'image_filename': image_filename
    }

def get_profile(user_id):
    return profiles.get(user_id, {
        'user_id': user_id
    })
