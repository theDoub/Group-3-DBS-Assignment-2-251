from flask import request, jsonify
from routes import cart_bp
from db import query_all, query_one, execute

@cart_bp.get("")
def cart_item_list():
    """Get cart items for a customer when they view their cart"""
    account_id = request.args.get("accountId")
    print(f"DEBUG:[cart_item_list] account_id = {account_id}")
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
            getPriceByFormatID(CI.FormatID) AS PricePerItem
        FROM CartItem CI
        JOIN Format F ON CI.FormatID = F.FormatID
        JOIN ShoppingCart SC ON CI.CartID = SC.CartID
        WHERE SC.AccountID = %s
    """
    items = query_all(sql, [account_id])
    print(f"DEBUG:[cart_item_list] items = {items}")
    return jsonify(items)

@cart_bp.post("")
def add_to_cart():
    """Add item to cart when a customer click buy button of a book edition"""
    data = request.get_json() or {}
    account_id = data.get("accountId")
    format_id = data.get("formatId")
    quantity = data.get("quantity", 1)
    
    if not account_id or not format_id:
        return jsonify({"error": "accountId and formatId required"}), 400
    
    sql = "INSERT INTO CartItem (CartID, FormatID, Quantity) VALUES (getCartIDByAccountID(%s), %s, %s)"
    execute(sql, [account_id, format_id, quantity])
    return jsonify({"message": "Item added to cart"}), 201

@cart_bp.delete("/<item_no>")
def remove_from_cart(item_no):
    """Remove item from cart"""
    data = request.get_json() or {}
    cart_id = data.get("cartId")

    if not cart_id or not item_no:
        return jsonify({"error": "cartId and itemNo required"}), 400
    
    sql = "DELETE FROM CartItem WHERE CartID = %s AND ItemNo = %s"
    execute(sql, [cart_id, item_no])
    return jsonify({"message": "Item removed"}), 200