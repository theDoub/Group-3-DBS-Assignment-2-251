# routes/auth_routes.py

from flask import Blueprint, request, jsonify
from routes import auth_bp
from db import query_one


@auth_bp.post("/login")
def login():
    """
    Đăng nhập bằng Username + Password.
    Để đơn giản: password input sẽ được so sánh trực tiếp với cột PasswordHash.
    Muốn test nhanh: insert Account có PasswordHash trùng với mật khẩu plain text.
    """
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    acc = query_one(
        "SELECT AccountID, Username, PasswordHash, Status "
        "FROM Account WHERE Username = %s",
        [username],
    )

    if not acc:
        return jsonify({"error": "User not found"}), 404

    if acc["Status"] != "active":
        return jsonify({"error": "Account is not active"}), 403

    # So sánh thẳng, cho assignment:
    if password != acc["PasswordHash"]:
        return jsonify({"error": "Invalid credentials"}), 401

    # Ở mức assignment, không cần JWT phức tạp. Trả về thông tin cơ bản.
    return jsonify(
        {
            "message": "Login successful",
            "accountID": acc["AccountID"],
            "username": acc["Username"],
        }
    )


@auth_bp.post("/logout")
def logout():
    """
    Ở mức API demo: logout chỉ đơn giản trả về OK.
    Thực tế FE chỉ cần xóa token/session ở phía client.
    """
    return jsonify({"message": "Logout successful"})
