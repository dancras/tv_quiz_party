import unittest

import model

class UnitTests(unittest.IsolatedAsyncioTestCase):
    def test_create_answers_store(self):
        k1 = "user_id_1"
        k2 = "user_id_2"
        store = model.create_answers_store([k1, k2])
        self.assertIsNot(store[k1], store[k2])

    def test_update_leaderboard_positions(self):
        leaderboard = {
            'p1': {
                'score': 5,
                'position': 3
            },
            'p2': {
                'score': 0,
                'position': 3
            },
            'p3': {
                'score': 2,
                'position': 2
            },
            'p4': {
                'score': 2,
                'position': 1
            }
        }
        model.update_leaderboard_positions(leaderboard)
        self.assertEqual(leaderboard, {
            'p1': {
                'score': 5,
                'position': 1
            },
            'p2': {
                'score': 0,
                'position': 3
            },
            'p3': {
                'score': 2,
                'position': 2
            },
            'p4': {
                'score': 2,
                'position': 2
            }
        })


if __name__ == "__main__":
    unittest.main()
