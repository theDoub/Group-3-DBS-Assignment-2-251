# routes/order_routes.py

from flask import request, jsonify
from routes import order_bp
from db import get_connection, query_all, query_one, execute


@order_bp.get("")
def list_orders():
    """
    Liệt kê các Order, join với CustomerAccount để hiện thông tin khách hàng.
    """
    sql = """
        SELECT 
            O.OrderID,
            O.OrderDate,
            O.Status,
            O.TotalAmount,
            CA.Name AS CustomerName
        FROM `Order` O
        JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
        ORDER BY O.OrderDate DESC
    """
    rows = query_all(sql)
    return jsonify(rows)


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
            OI.FormatID,
            OI.Quantity,
            OI.PricePerItem,
            OI.PriceAtPurchase
        FROM OrderItem OI
        WHERE OI.OrderID = %s
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
