from flask import Flask, request, jsonify, session, send_from_directory
import os
import json
import uuid
from flask_cors import CORS
from users import Users
from utils import Utils
from datetime import timedelta

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "avif", "gif", "webp"}

class_data = Users()
utils=Utils(allowed_extensions=ALLOWED_EXTENSIONS)

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.urandom(24)
app.permanent_session_lifetime = timedelta(days=7)

UPLOAD_FOLDER = "uploads"

@app.after_request
def set_cookie(response):
    response.headers["Set-Cookie"] = "session=your_cookie_value; Path=/; HttpOnly; SameSite=None; Secure"
    return response

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


########################################## LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    user_login = request.get_json()
    username = user_login.get('username')
    password = user_login.get('password')

    users = class_data.load_users()
    isFound = False
    for user in users:
        if user["username"] == username and user["password"] == password:
            isFound = True
            session.permanent = True
            session["username"] = username
            session["user_id"] = user["id"]
            print("Session after login:", session)  # Debugging
            break
    if isFound :
        return jsonify({"message": "Login Successfuly" ,"id" : user["id"]}), 200
    
    return jsonify({"Error": "Invalid Username or password"}), 401

############################################ CHECK SESSION
@app.route("/api/check_session", methods = ["GET"])
def check_session():
    if "username" in session:
        return jsonify({"logges_in": True, 
            "username": session["username"]
            , "id": session.get("user_id")}), 200

    return jsonify({"logged_in": False}), 401

#############################################
@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()  
    return jsonify({"message": "Logged out successfully"}), 200
###################################### REGISTER
@app.route("/api/register", methods = ["POST"])
def register():
    users = class_data.load_users()

    user_id = 1 if not users else max(user["id"] for user in users) + 1

    new_user = request.get_json()
    new_user["id"] = user_id
    firstname = new_user["firstname"]
    lastname = new_user["lastname"]
    username = new_user["username"]
    password = new_user["password"]
    new_user["memories"] = []

    if not firstname or not lastname or not username or not password :
        return jsonify({"error": "All fields must be entered"}), 400
    
    if any(user["username"] == username for user in users):
        return jsonify({"error": "This Username already exists"}), 401
    
    users.append({
        "id": user_id,
        "firstname": firstname,
        "lastmame": lastname,
        "username": username,
        "password": password,
        "memories": new_user["memories"]
    })
    class_data.save_users(users)
    return jsonify({"message": "egistration successful!"}), 200

###################################### ADD MEMORY
@app.route("/api/memories-home", methods=["POST"])
def add_memory():
    try:

        data = request.form  # Get form data 
        files = request.files.getlist("images")  # Get uploaded files

        # Check if user_id exists in session or form
        user_id = session.get("user_id") or data.get("user_id")

        if not user_id:
            return jsonify({"error": "User ID is missing"}), 400
        
        user_id = int(user_id)

        users = class_data.load_users()
        # Find user
        user = next((u for u in users if int(u["id"]) == user_id), None)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get memory details
        title = data.get("title")
        description = data.get("description")
        date = data.get("date")

        if not title or not date:
            return jsonify({"error": "Missing title or date"}), 400

        image_urls = []
        for file in files:
            if file and utils.allowed_file(file.filename):
                filename = f"{user_id}_{file.filename}"  # Unique filename
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)  # Save file to uploads folder
                image_urls.append(file_path)

        # Create new memory
        new_memory = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "date": date,
            "images": image_urls 
        }

        # Ensure "memories" key exists
        if "memories" not in user:
            user["memories"] = []

        user["memories"].append(new_memory)

        class_data.save_users(users)
        
        return jsonify({"message": "Memory added successfully!", "memory": new_memory}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#########################################
@app.route("/api/getAll-memories/", methods = ["GET"])
def getAll_memories():
    return jsonify(class_data.load_users())

##########################################
@app.route("/api/get-memories/<int:user_id>", methods = ["GET"])
def get_memory(user_id):
    for user in class_data.load_users():
        if user['id'] == user_id:
            return jsonify(user.get("memories", []))  # فقط الذكريات
    return jsonify({"message": "Memory not found"}), 404

###########################################

@app.route("/api/delete-memory/<title>", methods=["DELETE"])
def delete_memory(title):
    users = class_data.load_users()
    for user in users:
        if "memories" in user:
            user["memories"] = [m for m in user["memories"] if m["title"] != title]
    class_data.save_users(users)
    return jsonify({"message": "Memory deleted successfully!"}), 200 

##################################################

@app.route("/api/update-memory/<memory_id>", methods=["PUT"])
def update_memory(memory_id):
    data = request.form
    new_title = data.get("title")
    new_date = data.get("date")
    new_description = data.get("description")
    files = request.files.getlist("images")

    users = class_data.load_users()

    user_id = session.get("user_id") or request.form.get("user_id")
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = next((u for u in users if int(u["id"]) == int(user_id)), None)
    if not user:
        return jsonify({"error": "User not found"}), 404

    memory = next((m for m in user["memories"] if m["id"] == memory_id), None)
    if not memory:
        return jsonify({"error": "Memory not found"}), 404

    memory["title"] = new_title
    memory["date"] = new_date
    memory["description"] = new_description

    if files:
        for file in files:
            filename = f"{user_id}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            memory["images"].append(f"uploads/{filename}")

    class_data.save_users(users)
    return jsonify({"message": "Memory updated successfully!", "memory": memory}), 200





