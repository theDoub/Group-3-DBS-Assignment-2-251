# routes/__init__.py

from flask import Blueprint

auth_bp = Blueprint("auth", __name__, url_prefix="/api")
book_bp = Blueprint("books", __name__, url_prefix="/api/books")
cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")
order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

# Import các route để đăng ký với blueprint
from . import auth_routes, book_routes, cart_routes, order_routes  # noqa: F401