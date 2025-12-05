# routes/cart_routes.py

<<<<<<< HEAD
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
=======
from flask import Blueprint, request, jsonify
from db import query_all, query_one, execute

cart_bp = Blueprint("cart", __name__, url_prefix="/api")


@cart_bp.get("/cart")
def get_cart():
    """Get current user's cart with items"""
    account_id = request.args.get('account_id')
    
    if not account_id:
        return jsonify({"error": "account_id is required"}), 400
    
    # Check if CustomerAccount exists, create if not
    customer = query_one("SELECT AccountID FROM CustomerAccount WHERE AccountID = %s", [account_id])
    if not customer:
        # Get account info
        account = query_one("SELECT Username FROM Account WHERE AccountID = %s", [account_id])
        if account:
            execute("INSERT INTO CustomerAccount (AccountID, Name) VALUES (%s, %s)", [account_id, account['Username']])
    
    # Get or create cart
    cart = query_one("SELECT CartID FROM ShoppingCart WHERE AccountID = %s", [account_id])
    
    if not cart:
        # Create cart if doesn't exist
        execute("INSERT INTO ShoppingCart (AccountID) VALUES (%s)", [account_id])
        cart = query_one("SELECT CartID FROM ShoppingCart WHERE AccountID = %s", [account_id])
    
    cart_id = cart['CartID']        # Get cart items
    items = query_all("""
        SELECT 
            ci.ItemNo,
            ci.CartID,
            ci.FormatID,
            ci.Quantity,
            b.BookID,
            b.Title,
            e.Price,
            (ci.Quantity * e.Price) AS Subtotal
        FROM CartItem ci
        JOIN Format f ON ci.FormatID = f.FormatID
        JOIN Edition e ON f.EditionID = e.EditionID
        JOIN Book b ON e.BookID = b.BookID
        WHERE ci.CartID = %s
        ORDER BY ci.ItemNo
    """, [cart_id])
    
    total = sum(item['Subtotal'] for item in items)
    
    return jsonify({
        "cartId": cart_id,
        "items": items,
        "total": float(total)
    })


@cart_bp.post("/cart/add")
def add_to_cart():
    """Add item to cart"""
    data = request.get_json() or {}
    account_id = data.get('account_id')
    format_id = data.get('format_id')
    quantity = data.get('quantity', 1)
    
    if not account_id or not format_id:
        return jsonify({"error": "account_id and format_id are required"}), 400
    
    # Check if CustomerAccount exists, create if not
    customer = query_one("SELECT AccountID FROM CustomerAccount WHERE AccountID = %s", [account_id])
    if not customer:
        # Get account info
        account = query_one("SELECT Username FROM Account WHERE AccountID = %s", [account_id])
        if account:
            execute("INSERT INTO CustomerAccount (AccountID, Name) VALUES (%s, %s)", [account_id, account['Username']])
    
    # Get or create cart
    cart = query_one("SELECT CartID FROM ShoppingCart WHERE AccountID = %s", [account_id])
    
    if not cart:
        execute("INSERT INTO ShoppingCart (AccountID) VALUES (%s)", [account_id])
        cart = query_one("SELECT CartID FROM ShoppingCart WHERE AccountID = %s", [account_id])
    
    cart_id = cart['CartID']        # Check if item already exists in cart
    existing_item = query_one("""
        SELECT ItemNo, Quantity 
        FROM CartItem 
        WHERE CartID = %s AND FormatID = %s
    """, [cart_id, format_id])
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item['Quantity'] + quantity
        execute("""
            UPDATE CartItem 
            SET Quantity = %s 
            WHERE CartID = %s AND FormatID = %s
        """, [new_quantity, cart_id, format_id])
    else:
        # Get next ItemNo
        max_item = query_one("SELECT MAX(ItemNo) as MaxNo FROM CartItem WHERE CartID = %s", [cart_id])
        next_item_no = (max_item['MaxNo'] or 0) + 1
        
        # Insert new item
        execute("""
            INSERT INTO CartItem (ItemNo, CartID, FormatID, Quantity)
            VALUES (%s, %s, %s, %s)
        """, [next_item_no, cart_id, format_id, quantity])
    
    return jsonify({"message": "Item added to cart successfully"}), 201


@cart_bp.put("/cart/update")
def update_cart_item():
    """Update cart item quantity"""
    data = request.get_json() or {}
    account_id = data.get('account_id')
    cart_id = data.get('cart_id')
    item_no = data.get('item_no')
    quantity = data.get('quantity')
    
    if not account_id or not cart_id or item_no is None or not quantity:
        return jsonify({"error": "account_id, cart_id, item_no, and quantity are required"}), 400
    
    # SECURITY CHECK: Verify cart belongs to this account
    cart = query_one("SELECT CartID FROM ShoppingCart WHERE CartID = %s AND AccountID = %s", [cart_id, account_id])
    if not cart:
        return jsonify({"error": "Unauthorized: Cart does not belong to this account"}), 403
    
    if quantity <= 0:
        # Remove item if quantity is 0 or less
        execute("DELETE FROM CartItem WHERE CartID = %s AND ItemNo = %s", [cart_id, item_no])
        return jsonify({"message": "Item removed from cart"})
    
    execute("""
        UPDATE CartItem 
        SET Quantity = %s 
        WHERE CartID = %s AND ItemNo = %s
    """, [quantity, cart_id, item_no])
    
    return jsonify({"message": "Cart item updated"})


@cart_bp.delete("/cart/item")
def remove_cart_item():
    """Remove item from cart"""
    account_id = request.args.get('account_id')
    cart_id = request.args.get('cart_id')
    item_no = request.args.get('item_no')
    
    if not account_id or not cart_id or not item_no:
        return jsonify({"error": "account_id, cart_id and item_no are required"}), 400
    
    # SECURITY CHECK: Verify cart belongs to this account
    cart = query_one("SELECT CartID FROM ShoppingCart WHERE CartID = %s AND AccountID = %s", [cart_id, account_id])
    if not cart:
        return jsonify({"error": "Unauthorized: Cart does not belong to this account"}), 403
    
    execute("DELETE FROM CartItem WHERE CartID = %s AND ItemNo = %s", [cart_id, item_no])
    
    return jsonify({"message": "Item removed from cart"})


@cart_bp.post("/cart/checkout")
def checkout():
    """Checkout - create order from cart"""
    data = request.get_json() or {}
    account_id = data.get('account_id')
    discount_codes = data.get('discount_codes', [])  # List of discount codes
    delivery_address = data.get('delivery_address', '')
    
    if not account_id:
        return jsonify({"error": "account_id is required"}), 400
    
    if not delivery_address:
        return jsonify({"error": "delivery_address is required"}), 400
    
    # Get cart
    cart = query_one("SELECT CartID FROM ShoppingCart WHERE AccountID = %s", [account_id])
    
    if not cart:
        return jsonify({"error": "Cart not found"}), 404
    
    cart_id = cart['CartID']
    
    # Get cart items
    items = query_all("""
        SELECT 
            ci.ItemNo,
            ci.FormatID,
            ci.Quantity,
            e.Price
        FROM CartItem ci
        JOIN Format f ON ci.FormatID = f.FormatID
        JOIN Edition e ON f.EditionID = e.EditionID
        WHERE ci.CartID = %s
    """, [cart_id])
    
    if not items:
        return jsonify({"error": "Cart is empty"}), 400
    
    # Update customer delivery address
    execute("UPDATE CustomerAccount SET DeliveryAddress = %s WHERE AccountID = %s", [delivery_address, account_id])
    
    # Create order
    execute("INSERT INTO `Order` (AccountID, Status) VALUES (%s, 'pending')", [account_id])
    
    # Get the newly created order
    order = query_one("""
        SELECT OrderID FROM `Order` 
        WHERE AccountID = %s 
        ORDER BY OrderDate DESC 
        LIMIT 1
    """, [account_id])
    
    order_id = order['OrderID']
    
    # Process discounts
    valid_discounts = []
    if discount_codes:
        for code in discount_codes:
            discount = query_one("""
                SELECT DiscountID, Type, Value, MaxAppliedItem
                FROM Discount
                WHERE Name = %s
            """, [code])
            if discount:
                valid_discounts.append(discount)
    
    # Add items to order
    total_amount = 0
    for idx, item in enumerate(items, 1):
        price_per_item = float(item['Price'])
        quantity = item['Quantity']
        
        # Apply discount if available
        price_at_purchase = price_per_item * quantity
        applied_discount = None
        
        for discount in valid_discounts:
            if discount['MaxAppliedItem'] and idx > discount['MaxAppliedItem']:
                continue
            
            if discount['Type'] == 'percentage':
                discount_amount = price_at_purchase * (float(discount['Value']) / 100)
                price_at_purchase -= discount_amount
            elif discount['Type'] == 'fixed_amount':
                price_at_purchase -= float(discount['Value'])
            
            price_at_purchase = max(0, price_at_purchase)
            applied_discount = discount['DiscountID']
            break
        
        # Insert order item
        execute("""
            INSERT INTO OrderItem (OrderNo, OrderID, FormatID, Quantity, PricePerItem, PriceAtPurchase)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, [idx, order_id, item['FormatID'], quantity, price_per_item, price_at_purchase])
        
        # Link discount if applied
        if applied_discount:
            execute("""
                INSERT INTO DiscountApply (DiscountID, OrderNo, OrderID)
                VALUES (%s, %s, %s)
            """, [applied_discount, idx, order_id])
        
        total_amount += price_at_purchase
    
    # Update order total
    execute("UPDATE `Order` SET TotalAmount = %s WHERE OrderID = %s", [total_amount, order_id])
    
    # Clear cart
    execute("DELETE FROM CartItem WHERE CartID = %s", [cart_id])
    
    return jsonify({
        "message": "Order created successfully",
        "orderId": order_id,
        "totalAmount": float(total_amount)
    }), 201
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
