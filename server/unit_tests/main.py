import unittest

import model

class UnitTests(unittest.IsolatedAsyncioTestCase):
    def test_create_answers_store(self):
        k1 = "user_id_1"
        k2 = "user_id_2"
        store = model.create_answers_store([k1, k2])
        self.assertIsNot(store[k1], store[k2])


if __name__ == "__main__":
    unittest.main()