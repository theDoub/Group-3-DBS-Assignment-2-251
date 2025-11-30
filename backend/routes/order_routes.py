# routes/order_routes.py

from flask import request, jsonify
from routes import order_bp
from db import get_connection, query_all, query_one, execute


@order_bp.get("")
def list_orders():
    """
    Liệt kê các Order với phân quyền:
    - Customer: chỉ xem order của mình
    - Super Admin / Order Manager: xem tất cả order
    """
    account_id = request.args.get('account_id')
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


@order_bp.get("/<order_id>")
def get_order_detail(order_id):
    """
    Chi tiết đơn hàng với phân quyền:
    - Customer: chỉ xem order của mình
    - Super Admin / Order Manager: xem tất cả order
    """
    account_id = request.args.get('account_id')
    roles = request.args.get('roles', '')
    
    if not account_id:
        return jsonify({"error": "account_id is required"}), 400
    
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
            OI.FormatID,
            OI.Quantity,
            OI.PricePerItem,
            OI.PriceAtPurchase,
            B.Title AS BookTitle,
            B.BookID
        FROM OrderItem OI
        JOIN Format F ON OI.FormatID = F.FormatID
        JOIN Edition E ON F.EditionID = E.EditionID
        JOIN Book B ON E.BookID = B.BookID
        WHERE OI.OrderID = %s
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


@order_bp.put("/<order_id>/status")
def update_order_status(order_id):
    """
    Cập nhật trạng thái đơn hàng - chỉ dành cho Super Admin và Order Manager
    """
    data = request.get_json() or {}
    account_id = data.get('account_id')
    roles = data.get('roles', '')
    new_status = data.get('status')
    
    if not account_id or not new_status:
        return jsonify({"error": "account_id and status are required"}), 400
    
    # Parse roles và kiểm tra quyền
    role_list = [r.strip() for r in roles.split(',') if r.strip()]
    is_admin = 'Super Admin' in role_list or 'Order Manager' in role_list
    
    if not is_admin:
        return jsonify({"error": "Unauthorized: Only Super Admin or Order Manager can update order status"}), 403
    
    # Validate status
    valid_statuses = ['pending', 'processing', 'confirmed', 'delivered', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
    
    # Check order exists
    order = query_one("SELECT OrderID, Status FROM `Order` WHERE OrderID = %s", [order_id])
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    # Update status
    execute("UPDATE `Order` SET Status = %s WHERE OrderID = %s", [new_status, order_id])
    
    # Also update delivery status if applicable
    if new_status == 'confirmed':
        execute("UPDATE Delivery SET Status = 'preparing' WHERE OrderID = %s", [order_id])
    elif new_status == 'processing':
        execute("UPDATE Delivery SET Status = 'shipped' WHERE OrderID = %s", [order_id])
    elif new_status == 'delivered':
        execute("UPDATE Delivery SET Status = 'delivered' WHERE OrderID = %s", [order_id])
    elif new_status == 'cancelled':
        execute("UPDATE Delivery SET Status = 'cancelled' WHERE OrderID = %s", [order_id])
    
    return jsonify({
        "message": "Order status updated successfully",
        "orderId": order_id,
        "oldStatus": order['Status'],
        "newStatus": new_status
    })


@order_bp.post("/<order_id>/recalculate-total")
def recalculate_total(order_id):
    """
    Gọi stored procedure CalculateAndUpdateOrderTotal(p_OrderID).
    Đây là minh chứng gọi stored procedure từ application.
    """
    # Check order tồn tại
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

    if not discount_id or not order_no:
        return jsonify({"error": "Thiếu thông tin discountID hoặc orderNo"}), 400

    # 1. Kiểm tra OrderItem có tồn tại không
    order_item = query_one(
        "SELECT OrderID FROM OrderItem WHERE OrderID = %s AND OrderNo = %s",
        [order_id, order_no],
    )
    if not order_item:
        return jsonify({"error": "Không tìm thấy sản phẩm trong đơn hàng"}), 404

    # 2. Gọi stored procedure ApplyDiscountLogic
    conn = get_connection()
    try:
        cursor = conn.cursor()

        try:
            cursor.callproc("ApplyDiscountLogic", [discount_id, order_id, order_no])
            conn.commit()

        except Exception as e:
            error_str = str(e)

            # Các lỗi có MESSAGE_TEXT từ SIGNAL SQLSTATE
            if "Discount already applied" in error_str:
                return jsonify({
                    "status": "error",
                    "message": "Mã giảm giá này đã áp dụng rồi!"
                }), 409

            if "Discount expired" in error_str:
                return jsonify({
                    "status": "error",
                    "message": "Mã giảm giá đã hết hạn!"
                }), 400

            if "Discount max applications reached" in error_str:
                return jsonify({
                    "status": "error",
                    "message": "Đã đạt số lần sử dụng tối đa cho mã này!"
                }), 400

            # Lỗi trùng trong DiscountApply (cũng có thể xảy ra)
            if "1062" in error_str:
                return jsonify({
                    "status": "error",
                    "message": "Mã giảm giá đã được áp dụng trước đó!"
                }), 409

            return jsonify({"error": error_str}), 400

    finally:
        conn.close()

    # 3. Lấy dữ liệu sau khi procedure cập nhật
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
