# routes/order_routes.py

from flask import request, jsonify
from routes import order_bp
from db import get_connection, query_all, query_one, execute

# For Apply Discount Modal
@order_bp.get("/discounts")
def list_discounts():
    """
    Lấy danh sách tất cả discount có sẵn.
    """
    print("[list_discounts] Fetching all discounts")
    sql = """
        SELECT 
            DiscountID,
            Name,
            Type,
            Value,
            Conditions
        FROM Discount
        ORDER BY DiscountID
    """
    discounts = query_all(sql)
    return jsonify(discounts)

# For Orders List
@order_bp.get("")
def list_orders():
    """
    Liệt kê các Order với phân quyền:
    - Customer: chỉ xem order của mình
    - Super Admin / Order Manager: xem tất cả order
    """
    account_id = request.args.get('accountId')
    roles = request.args.get('roles', '')  # Comma-separated roles
    
    if not account_id:
        return jsonify({"error": "account_id is required"}), 400
    
    # Parse roles
    role_list = [r.strip() for r in roles.split(',') if r.strip()]
    
    # Check if user is admin
    is_admin = 'Super Admin' in role_list or 'Order Manager' in role_list
    
    if is_admin:
        # Admin: xem tất cả orders
        sql = """
            SELECT 
                O.OrderID,
                O.AccountID,
                O.OrderDate,
                O.Status,
                O.TotalAmount,
                CA.Name AS CustomerName
            FROM `Order` O
            JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
            ORDER BY O.OrderDate DESC
        """
        rows = query_all(sql)
    else:
        # Customer: chỉ xem order của mình
        sql = """
            SELECT 
                O.OrderID,
                O.AccountID,
                O.OrderDate,
                O.Status,
                O.TotalAmount,
                CA.Name AS CustomerName
            FROM `Order` O
            JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
            WHERE O.AccountID = %s
            ORDER BY O.OrderDate DESC
        """
        rows = query_all(sql, [account_id])
    
    return jsonify(rows)


# For details of a specific order
@order_bp.get("/<order_id>")
def get_order_detail(order_id):
    """
    Chi tiết đơn hàng với phân quyền:
    - Customer: chỉ xem order của mình
    - Super Admin / Order Manager: xem tất cả order
    """
    account_id = request.args.get('accountId')
    
    roles = request.args.get('roles', '')
    
    if not account_id:
        print("account_id is missing in request")
        return jsonify({"error": "account_id is required"}), 400
    
    print(f"Fetching details for OrderID: {order_id} by AccountID: {account_id} with roles: {roles}")
    # Parse roles
    role_list = [r.strip() for r in roles.split(',') if r.strip()]
    is_admin = 'Super Admin' in role_list or 'Order Manager' in role_list
    
    order = query_one(
        """
        SELECT 
            O.OrderID,
            O.AccountID,
            O.OrderDate,
            O.Status,
            O.TotalAmount,
            CA.Name AS CustomerName,
            CA.DeliveryAddress
        FROM `Order` O
        JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
        WHERE O.OrderID = %s
        """,
        [order_id],
    )

    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    # SECURITY CHECK: Customer chỉ xem được order của mình
    if not is_admin and order['AccountID'] != account_id:
        return jsonify({"error": "Unauthorized: You can only view your own orders"}), 403

    items = query_all(
        """
        SELECT 
            OI.OrderNo,
            F.FormatType,
            OI.FormatID, 
            OI.Quantity,
            OI.PricePerItem,
            OI.PriceAtPurchase,
            B.Title AS BookTitle,
            B.BookID,
            GROUP_CONCAT(DISTINCT D.Name ORDER BY D.Name SEPARATOR ', ') AS AppliedDiscounts
        FROM OrderItem OI
        LEFT JOIN DiscountApply DA ON OI.OrderID = DA.OrderID AND OI.OrderNo = DA.OrderNo
        LEFT JOIN Discount D ON DA.DiscountID = D.DiscountID
        JOIN Format F ON OI.FormatID = F.FormatID
        JOIN Edition E ON F.EditionID = E.EditionID
        JOIN Book B ON E.BookID = B.BookID
        WHERE OI.OrderID = %s
        GROUP BY OI.OrderNo, OI.FormatID, OI.Quantity, OI.PricePerItem, OI.PriceAtPurchase
        ORDER BY OI.OrderNo
        """,
        [order_id],
    )
    
    # Get delivery info
    delivery = query_one(
        """
        SELECT Status, Carrier, TrackingNumber, 
               ActualShippingDate, ExpectedShippingDate
        FROM Delivery
        WHERE OrderID = %s
        """,
        [order_id]
    )
    
    # Get applied discounts
    discounts = query_all(
        """
        SELECT D.Name, D.Type, D.Value, DA.OrderNo
        FROM DiscountApply DA
        JOIN Discount D ON DA.DiscountID = D.DiscountID
        WHERE DA.OrderID = %s
        """,
        [order_id]
    )

    order["items"] = items
    order["delivery"] = delivery
    order["discounts"] = discounts
    return jsonify(order)


# NEW: User submits payment (creates payment record, status stays pending)
@order_bp.post("/<order_id>/submit-payment")
def submit_payment(order_id):
    """
    Customer submits payment. Creates Payment record but order stays PENDING
    waiting for admin approval.
    """
    data = request.get_json() or {}
    account_id = data.get("accountId")
    payment_method = data.get("paymentMethod", "credit_card")
    
    if not account_id:
        print("accountId is missing in request")
        return jsonify({"error": "accountId required"}), 400
    
    print(f"[submit_payment] AccountID {account_id} submitting payment for OrderID {order_id} using {payment_method}")
    
    # Verify order exists and belongs to user
    order = query_one(
        "SELECT OrderID, AccountID FROM `Order` WHERE OrderID = %s",
        [order_id]
    )
    
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    if order['AccountID'] != account_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Create payment record
        cursor.execute("""
            INSERT INTO Payment (OrderID, Method, PaymentDate, Status)
            VALUES (%s, %s, NOW(), 'pending')
        """, [order_id, payment_method])
        
        conn.commit()

        print(f"[submit_payment] Payment record created for OrderID {order_id}")
        
        return jsonify({
            "message": "Payment submitted successfully. Waiting for admin approval.",
            "orderId": order_id,
            "status": "pending"
        }), 201
        
    finally:
        cursor.close()
        conn.close()


@order_bp.post("/<order_id>/recalculate-total")
def recalculate_total(order_id):
    """
    Gọi stored procedure CalculateAndUpdateOrderTotal(p_OrderID).
    """
    exist = query_one("SELECT OrderID FROM `Order` WHERE OrderID = %s", [order_id])
    if not exist:
        return jsonify({"error": "Order not found"}), 404

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.callproc("CalculateAndUpdateOrderTotal", [order_id])
        conn.commit()
    finally:
        conn.close()

    updated = query_one(
        "SELECT OrderID, TotalAmount FROM `Order` WHERE OrderID = %s", [order_id]
    )

    return jsonify(
        {
            "message": "Order total recalculated using stored procedure",
            "order": updated,
        }
    )


@order_bp.post("/<order_id>/apply-discount")
def apply_discount(order_id):
    data = request.get_json() or {}
    discount_id = data.get("discountID")
    order_no = data.get("orderNo")
    order_id = data.get("orderID") # Nhận thêm từ body cho chắc

    if not discount_id or not order_no:
        print("[apply_discount] Missing discountID or orderNo in request")
        return jsonify({"error": "Thiếu thông tin discountID hoặc orderNo"}), 400

    print(f"[apply_discount] Applying discountID {discount_id} to OrderID {order_id}, OrderNo {order_no}")

    order_item = query_one(
        "SELECT OrderID FROM OrderItem WHERE OrderID = %s AND OrderNo = %s",
        [order_id, order_no],
    )
    if not order_item:
        return jsonify({"error": "Không tìm thấy sản phẩm trong đơn hàng"}), 404

    conn = get_connection()
    try:
        cursor = conn.cursor()

        try:
            cursor.callproc("ApplyDiscountLogic", [discount_id, order_id, order_no])
            conn.commit()

        except Exception as e:
            error_str = str(e)
            if "Discount already applied" in error_str:
                return jsonify({"status": "error", "message": "Mã giảm giá này đã áp dụng rồi!"}), 409
            if "Discount expired" in error_str:
                return jsonify({"status": "error", "message": "Mã giảm giá đã hết hạn!"}), 400
            if "Discount max applications reached" in error_str:
                return jsonify({"status": "error", "message": "Đã đạt số lần sử dụng tối đa cho mã này!"}), 400
            if "1062" in error_str:
                return jsonify({"status": "error", "message": "Mã giảm giá đã được áp dụng trước đó!"}), 409

            return jsonify({"error": error_str}), 400

        cursor.execute(
        "INSERT INTO DiscountApply (DiscountID, OrderID, OrderNo) VALUES (%s, %s, %s)",
        [discount_id, order_id, order_no]
        )
        conn.commit()

        # Recalculate total
        cursor.callproc("CalculateAndUpdateOrderTotal", [order_id])
        conn.commit()

    finally:
        conn.close()

    updated_item = query_one(
        """
        SELECT OrderNo, OrderID, PricePerItem, Quantity, PriceAtPurchase
        FROM OrderItem
        WHERE OrderID = %s AND OrderNo = %s
        """,
        [order_id, order_no],
    )

    updated_order = query_one(
        "SELECT OrderID, TotalAmount FROM `Order` WHERE OrderID = %s",
        [order_id]
    )

    return jsonify({
        "status": "success",
        "message": "Áp dụng mã giảm giá thành công!",
        "orderItem": updated_item,
        "order": updated_order
    }), 200


@order_bp.post("/<order_id>/delete-discount")
def delete_discount(order_id):
    """
    Xoá discount khỏi OrderItem.
    """
    data = request.get_json() or {}
    discount_id = data.get("discountID")
    order_no = data.get("orderNo")
    
    if not discount_id or not order_no:
        print("[delete_discount] Missing discountID or orderNo in request")
        return jsonify({"error": "discountID, orderNo required"}), 400

    print(f"[delete_discount] Removing discountID {discount_id} from OrderID {order_id}, OrderNo {order_no}")

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Get DiscountID by discount name
        cursor.execute(
            "SELECT DiscountID FROM Discount WHERE Name = %s",
            [discount_id]
        )
        discount_row = cursor.fetchone()
        
        if not discount_row:
            return jsonify({"error": f"Discount '{discount_id}' not found"}), 404
        
        discount_id = discount_row['DiscountID']
        
        # 2. Delete from DiscountApply table
        cursor.execute(
            "DELETE FROM DiscountApply WHERE DiscountID = %s AND OrderID = %s AND OrderNo = %s",
            [discount_id, order_id, order_no]
        )
        conn.commit()
        
        cursor.callproc("UnapplyDiscountLogic", [discount_id, order_id, order_no])
        conn.commit()
        
        # Recalculate Total
        cursor.callproc("CalculateAndUpdateOrderTotal", [order_id])
        conn.commit()
        
        order = query_one("SELECT OrderID, TotalAmount FROM `Order` WHERE OrderID = %s", [order_id])
        
        return jsonify({"message": "Discount removed successfully", "order": order}), 200
        
    finally:
        cursor.close()
        conn.close()


@order_bp.post("")
def create_order():
    """
    Tạo order mới và thêm những cart item hiện có vào order đó.
    """
    data = request.get_json() or {}
    account_id = data.get("accountId")

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Create new order
        cursor.execute(
            "INSERT INTO `Order` (AccountID, OrderDate, Status, TotalAmount) VALUES (%s, NOW(), 'pending', 0)",
            [account_id]
        )
        conn.commit()

        # Get the most recent OrderID
        order = query_one(
            "SELECT OrderID FROM `Order` ORDER BY OrderDate DESC, OrderID DESC LIMIT 1"
        )
        print(f"[create_order] Order created: {order}")

        # Get CartItems
        cart_items = query_all(
            """
            SELECT CI.FormatID, CI.Quantity
            FROM CartItem CI
            JOIN ShoppingCart SC ON CI.CartID = SC.CartID
            WHERE SC.AccountID = %s
            """,
            [account_id]
        )

        # Insert into OrderItem
        for item in cart_items:
            format_id = item["FormatID"]
            quantity = item["Quantity"]
            cursor.execute(
                """INSERT INTO OrderItem (OrderID, FormatID, Quantity)
                    VALUES (%s, %s, %s)""",
                [order["OrderID"], format_id, quantity]
            )
        conn.commit()
        
        # OPTIONAL: Xóa CartItem sau khi tạo đơn (Logic thực tế nên có)
        # cursor.execute(
        #    "DELETE FROM CartItem WHERE CartID = (SELECT CartID FROM ShoppingCart WHERE AccountID = %s)",
        #    [account_id]
        # )
        # conn.commit()

        print(f"[create_order] Successfully added items to OrderID {order['OrderID']}")
        
        return jsonify({"orderId": order["OrderID"], "message": "Order created"}), 201
        
    finally:
        cursor.close()
        conn.close()


@order_bp.post("/<order_id>/items")
def add_order_item(order_id):
    """
    Thêm item vào order hiện tại.
    """
    data = request.get_json() or {}
    book_id = data.get("bookId")
    quantity = data.get("quantity", 1)

    if not book_id or quantity < 1:
        return jsonify({"error": "bookId and quantity required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT EditionID FROM Edition WHERE BookID = %s LIMIT 1", [book_id])
        edition = cursor.fetchone()
        
        if not edition:
            return jsonify({"error": "Edition not found"}), 404

        edition_id = edition["EditionID"]
        cursor.execute("SELECT FormatID FROM Format WHERE EditionID = %s LIMIT 1", [edition_id])
        format_data = cursor.fetchone()
        
        if not format_data:
            return jsonify({"error": "Format not found"}), 404

        format_id = format_data["FormatID"]

        cursor.execute(
            "INSERT INTO OrderItem (OrderID, FormatID, Quantity) VALUES (%s, %s, %s)",
            [order_id, format_id, quantity]
        )
        conn.commit()
        return jsonify({"message": "Item added to order", "orderID": order_id}), 201
        
    finally:
        cursor.close()
        conn.close()


@order_bp.put("/<order_id>/status")
def update_order_status(order_id):
    """
    API để chuyển trạng thái đơn hàng (Ví dụ: pending -> confirmed, hoặc cancelled)
    """
    data = request.get_json() or {}
    new_status = data.get("status")
    
    # Danh sách trạng thái hợp lệ trong Database
    valid_statuses = ['pending', 'processing', 'confirmed', 'delivered', 'cancelled']

    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400

    # Thực hiện Update trong Database
    # Lưu ý: `Order` là từ khóa trong SQL nên cần bọc backticks ``
    sql = "UPDATE `Order` SET Status = %s WHERE OrderID = %s"
    
    try:
        execute(sql, [new_status, order_id])
        return jsonify({"message": f"Order status updated to {new_status}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    



@order_bp.post("/reviews")
def create_review():
    """Create a book review for a confirmed order item."""
    data = request.get_json()
    
    book_id = data.get('BookID')
    order_id = data.get('OrderID')
    order_no = data.get('OrderNo')
    rating = data.get('Rating')
    comment = data.get('Comment')
    account_id = data.get('AccountID')

    print(f"[create_review] Received review data: BookID={book_id}, OrderID={order_id}, OrderNo={order_no}, Rating={rating}, AccountID={account_id}")
    
    if not all([book_id, order_id, rating, comment, account_id]):
        print("[create_review] Missing required fields")
        return jsonify({"error": "All fields required"}), 400
    
    try:
        rating_int = int(rating)
        if not (1 <= rating_int <= 5):
            print("[create_review] Rating out of valid range")
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
    except ValueError:
        return jsonify({"error": "Invalid rating value"}), 400
    
    
    if len(comment.strip()) < 10:
        return jsonify({"error": "Review comment must be at least 10 characters"}), 400
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Insert review
        insert_sql = """
        INSERT INTO Review (OrderID, OrderNo, Rating, Comment, ReviewDate)
        VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(insert_sql, [
            order_id, order_no, 
            rating_int, comment.strip()
        ])
        conn.commit()
        cursor.close()
        
        print(f"[create_review] Review created for Book {book_id}, Order {order_id}, Item {order_no}")
        return jsonify({"message": "Review submitted successfully"}), 201
        
    except Exception as e:
        conn.rollback()
        print(f"[create_review] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@order_bp.get("/reviews")
def get_user_reviews():
    """Get all reviews submitted by a user."""
    account_id = request.args.get('accountId')
    
    if not account_id:
        return jsonify({"error": "accountId required"}), 400
    
    print(f"[get_user_reviews] Fetching reviews for AccountID {account_id}")
    
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        sql = """
        SELECT r.ReviewID, r.OrderNo, r.OrderID, r.Rating, r.Comment, r.ReviewDate
        FROM Review r
        JOIN `Order` o ON r.OrderID = o.OrderID
        JOIN CustomerAccount ca ON o.AccountID = ca.AccountID
        WHERE ca.AccountID = %s
        ORDER BY r.ReviewDate DESC
        """
        cursor.execute(sql, [account_id])
        reviews = cursor.fetchall()
        cursor.close()
        
        print(f"[get_user_reviews] Retrieved {len(reviews)} reviews for account {account_id}")
        return jsonify(reviews), 200
    except Exception as e:
        print(f"[get_user_reviews] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()



@order_bp.delete("/reviews/<int:review_id>")
def delete_review(review_id):
    """Delete a review submitted by user."""
    data = request.get_json() or {}
    account_id = data.get('AccountID')
    
    if not account_id:
        return jsonify({"error": "AccountID required"}), 400
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Verify review belongs to user
        cursor.execute(
            "SELECT ReviewID FROM Review WHERE ReviewID = %s",
            [review_id]
        )
        if not cursor.fetchone():
            return jsonify({"error": "Review not found or access denied"}), 404
        
        # Delete review
        cursor.execute("DELETE FROM Review WHERE ReviewID = %s", [review_id])
        conn.commit()
        cursor.close()
        
        print(f"[delete_review] Review {review_id} deleted")
        return jsonify({"message": "Review deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        print(f"[delete_review] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()