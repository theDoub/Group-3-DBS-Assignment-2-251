# routes/author_routes.py

from flask import Blueprint, jsonify
from db import query_all

author_bp = Blueprint('author', __name__, url_prefix='/api/authors')


@author_bp.get("")
def list_authors():
    """Get all authors"""
    sql = "SELECT AuthorID, Name, Biography, Nationality FROM Author ORDER BY Name ASC"
    rows = query_all(sql)
    return jsonify(rows)
