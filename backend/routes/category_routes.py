# routes/category_routes.py

from flask import Blueprint, jsonify
from db import query_all

category_bp = Blueprint('category', __name__, url_prefix='/api/categories')


@category_bp.get("")
def list_categories():
    """Get all categories"""
    sql = "SELECT CategoryID, Name, Description FROM Category ORDER BY Name ASC"
    rows = query_all(sql)
    return jsonify(rows)
