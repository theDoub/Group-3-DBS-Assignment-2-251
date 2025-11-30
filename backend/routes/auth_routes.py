# routes/auth_routes.py

from flask import Blueprint, request, jsonify
from routes import auth_bp
from db import query_one, query_all


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
        "SELECT AccountID, Username, PasswordHash, Status, AccountType "
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

    # Lấy roles của user dựa trên AccountType và AdminRole
    roles = []
    
    # Kiểm tra AccountType
    account_type = acc.get("AccountType") if "AccountType" in acc else None
    
    # Nếu là Customer account
    customer = query_one(
        "SELECT AccountID FROM CustomerAccount WHERE AccountID = %s",
        [acc["AccountID"]]
    )
    
    # Nếu là Administrator account, lấy roles từ AdminRole
    admin_roles = query_all(
        """
        SELECT r.RoleName 
        FROM AdminRole ar
        JOIN Role r ON ar.RoleID = r.RoleID
        WHERE ar.AccountID = %s
        """,
        [acc["AccountID"]]
    )
    
    # Thêm admin roles nếu có
    if admin_roles:
        for role in admin_roles:
            roles.append(role["RoleName"])
    
    # Nếu là customer account hoặc không có admin role, thêm Customer role
    if customer or not roles:
        if "Customer" not in roles:
            roles.append("Customer")
    
    # Nếu vẫn không có role nào (trường hợp đặc biệt), set mặc định
    if not roles:
        roles.append("Customer")

    # Ở mức assignment, không cần JWT phức tạp. Trả về thông tin cơ bản.
    return jsonify(
        {
            "message": "Login successful",
            "accountID": acc["AccountID"],
            "username": acc["Username"],
            "roles": roles,
        }
    )


@auth_bp.post("/logout")
def logout():
    """
    Ở mức API demo: logout chỉ đơn giản trả về OK.
    Thực tế FE chỉ cần xóa token/session ở phía client.
    """
    return jsonify({"message": "Logout successful"})
