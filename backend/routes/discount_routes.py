# routes/discount_routes.py

from flask import Blueprint, jsonify, request
from db import query_all, query_one

discount_bp = Blueprint('discount', __name__, url_prefix='/api/discounts')


@discount_bp.get("")
def list_discounts():
    """Get all active discounts"""
    sql = """
        SELECT DiscountID, Name, Type, Value, MaxAppliedItem, Conditions, ValidityPeriod
        FROM Discount
        ORDER BY Name ASC
    """
    rows = query_all(sql)
    return jsonify(rows)


@discount_bp.get("/validate")
def validate_discount():
    """Validate a discount code"""
    code = request.args.get('code')
    
    if not code:
        return jsonify({"error": "code is required"}), 400
    
    discount = query_one("""
        SELECT DiscountID, Name, Type, Value, MaxAppliedItem, Conditions
        FROM Discount
        WHERE Name = %s
    """, [code])
    
    if not discount:
        return jsonify({"valid": False, "message": "Mã giảm giá không hợp lệ"}), 404
    
    return jsonify({
        "valid": True,
        "discount": discount,
        "message": f"Áp dụng thành công: {discount['Conditions']}"
    })
