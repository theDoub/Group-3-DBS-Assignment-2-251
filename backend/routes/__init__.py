# routes/__init__.py

from flask import Blueprint

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
book_bp = Blueprint("books", __name__, url_prefix="/api/books")
cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")
order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")
category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")
author_bp = Blueprint("authors", __name__, url_prefix="/api/authors")
admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# Import routes to register with blueprints
from . import auth_routes, book_routes, order_routes, category_routes, author_routes, admin_routes  # noqa: F401