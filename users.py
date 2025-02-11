import json
class Users:
    def __init__(self, user_file_path = "users.json"):
        self.user_file_path = user_file_path

    ################# Load And Save user Data In Json File

    def load_users(self):
        try:
            with open (self.user_file_path, "r") as reading:
                data = json.load(reading)
                return data
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def save_users(self, memory):
        with open(self.user_file_path, "w") as writing:
            json.dump(memory, writing, indent=4)