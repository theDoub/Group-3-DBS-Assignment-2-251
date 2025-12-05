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
    Liệt kê các Order, join với CustomerAccount để hiện thông tin khách hàng.
    """
    account_id = request.args.get("accountId")
    print(f"--DEBUG[list_orders] account_id: {account_id}")
    if not account_id:
        return jsonify({"error": "accountID is not provided"}), 400
    
    sql = """
        SELECT 
            O.OrderID,
            O.OrderDate,
            O.Status,
            O.TotalAmount
        FROM `Order` O
        JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
        WHERE O.AccountID = %s
        ORDER BY O.OrderDate DESC
    """
    orders = query_all(sql, [account_id])
    return jsonify(orders)

# For details of a specific order
@order_bp.get("/<order_id>")
def get_order_detail(order_id):
    order = query_one(
        """
        SELECT 
            O.OrderID,
            O.OrderDate,
            O.Status,
            O.TotalAmount,
            CA.Name AS CustomerName
        FROM `Order` O
        JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
        WHERE O.OrderID = %s
        """,
        [order_id],
    )

    if not order:
        return jsonify({"error": "Order not found"}), 404

    items = query_all(
        """
        SELECT 
            OI.OrderNo,
            F.FormatType,
            OI.FormatID, 
            OI.Quantity,
            OI.PricePerItem,
            OI.PriceAtPurchase,
            getTitleByFormatID(OI.FormatID) AS BookTitle,
            GROUP_CONCAT(AD.DiscountID SEPARATOR ', ') AS AppliedDiscounts
        FROM OrderItem OI
        LEFT JOIN DiscountApply AD ON OI.OrderID = AD.OrderID AND OI.OrderNo = AD.OrderNo
        LEFT JOIN Format F ON OI.FormatID = F.FormatID
        WHERE OI.OrderID = %s
        GROUP BY OI.OrderNo, OI.FormatID, OI.Quantity, OI.PricePerItem, OI.PriceAtPurchase
        ORDER BY OI.OrderNo
        """,
        [order_id],
    )

    order["items"] = items
    return jsonify(order)


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
        return jsonify({"error": "Thiếu thông tin discountID hoặc orderNo"}), 400

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
        return jsonify({"error": "discountID, orderNo required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
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
        print(f"--DEBUG create_order: created order = {order}")

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

# --- NEW: API ĐỂ CẬP NHẬT TRẠNG THÁI (PAY NOW / CANCEL) ---
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