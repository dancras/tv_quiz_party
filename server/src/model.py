def create_answers_store(user_ids):
    return dict((user_id, {}) for user_id in user_ids)