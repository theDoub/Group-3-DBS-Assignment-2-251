# routes/cart_routes.py

from flask import Blueprint, request, jsonify
from db import query_all, execute, query_one

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")

@cart_bp.get("")
def cart_item_list():
    """Get cart items"""
    account_id = request.args.get("accountId")
    if not account_id:
        return jsonify({"error": "account id required"}), 400
    print("[cart_item_list] Fetching cart items for account ID:", account_id)
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
    
    print("[add_to_cart] Adding to cart for account ID:", account_id, "Format ID:", format_id, "Quantity:", quantity)
    
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

@cart_bp.delete("")
def clear_cart():
    """Clear all items from cart for an account"""
    account_id = request.args.get("accountId")
    
    if not account_id:
        return jsonify({"error": "accountId required"}), 400
    
    print("[clear_cart] Clearing cart for account ID:", account_id)
    
    try:
        # Get CartID from AccountID
        cart_query = "SELECT CartID FROM ShoppingCart WHERE AccountID = %s"
        cart = query_one(cart_query, [account_id])
        
        if not cart:
            return jsonify({"error": "Cart not found"}), 404
        
        cart_id = cart['CartID']
        
        # Delete all items in cart
        delete_sql = "DELETE FROM CartItem WHERE CartID = %s"
        execute(delete_sql, [cart_id])
        
        print(f"[clear_cart] Cart {cart_id} cleared successfully")
        return jsonify({"message": "Cart cleared successfully"}), 200
    except Exception as e:
        print(f"[clear_cart] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
