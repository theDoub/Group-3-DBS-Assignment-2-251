# routes/cart_routes.py

from flask import request, jsonify
from routes import cart_bp
from db import query_all, execute, query_one

@cart_bp.get("")
def cart_item_list():
    """Get cart items"""
    account_id = request.args.get("accountId")
    if not account_id:
        return jsonify({"error": "accountId required"}), 400
    
    sql = """
        SELECT 
            CI.ItemNo,
            CI.TimeAdded,
            CI.Quantity,
            CI.CartID,
            getTitleByFormatID(CI.FormatID) AS BookTitle,
            F.FormatType,
            F.FormatID,
            E.Price AS PricePerItem  -- Lấy giá trực tiếp từ Edition
        FROM CartItem CI
        JOIN Format F ON CI.FormatID = F.FormatID
        JOIN Edition E ON F.EditionID = E.EditionID
        JOIN ShoppingCart SC ON CI.CartID = SC.CartID
        WHERE SC.AccountID = %s
        ORDER BY CI.TimeAdded DESC
    """
    items = query_all(sql, [account_id])
    return jsonify(items)

@cart_bp.post("")
def add_to_cart():
    """Add item to cart"""
    data = request.get_json() or {}
    account_id = data.get("accountId")
    format_id = data.get("formatId")
    quantity = data.get("quantity", 1)
    
    if not account_id or not format_id:
        return jsonify({"error": "accountId and formatId required"}), 400
    
    # Kiểm tra xem Format này đã có trong giỏ chưa, nếu có thì cộng dồn (Upsert logic)
    # Tuy nhiên với cấu trúc hiện tại (ItemNo tự tăng), ta insert mới hoặc để FE xử lý.
    # Để đơn giản cho bài tập: Cứ Insert, Trigger sẽ lo kiểm tra kho.
    
    sql = "INSERT INTO CartItem (CartID, FormatID, Quantity) VALUES (getCartIDByAccountID(%s), %s, %s)"
    try:
        execute(sql, [account_id, format_id, quantity])
        return jsonify({"message": "Item added to cart"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@cart_bp.put("/<item_no>")
def update_cart_item(item_no):
    """
    API MỚI: Cập nhật số lượng item trong giỏ (Tăng/Giảm)
    """
    data = request.get_json() or {}
    cart_id = data.get("cartId")
    new_quantity = data.get("quantity")

    if not cart_id or new_quantity is None:
        return jsonify({"error": "cartId and quantity required"}), 400

    if new_quantity < 1:
        return jsonify({"error": "Quantity must be at least 1"}), 400

    sql = "UPDATE CartItem SET Quantity = %s WHERE CartID = %s AND ItemNo = %s"
    try:
        execute(sql, [new_quantity, cart_id, item_no])
        return jsonify({"message": "Cart updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@cart_bp.delete("/<item_no>")
def remove_from_cart(item_no):
    """Remove item from cart"""
    data = request.get_json() or {}
    cart_id = data.get("cartId")

    if not cart_id:
        return jsonify({"error": "cartId required"}), 400
    
    sql = "DELETE FROM CartItem WHERE CartID = %s AND ItemNo = %s"
    execute(sql, [cart_id, item_no])
    return jsonify({"message": "Item removed"}), 200