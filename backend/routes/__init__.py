# routes/__init__.py

from flask import Blueprint

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
book_bp = Blueprint("books", __name__, url_prefix="/api/books")
order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")
category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")
author_bp = Blueprint("authors", __name__, url_prefix="/api/authors")

# Import routes to register with blueprints
from . import auth_routes, book_routes, order_routes, category_routes, author_routes  # noqa: F401
