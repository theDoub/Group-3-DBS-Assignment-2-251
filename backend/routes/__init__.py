# routes/__init__.py

from flask import Blueprint

<<<<<<< HEAD
auth_bp = Blueprint("auth", __name__, url_prefix="/api")
book_bp = Blueprint("books", __name__, url_prefix="/api/books")
cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")
order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

# Import các route để đăng ký với blueprint
from . import auth_routes, book_routes, cart_routes, order_routes  # noqa: F401
=======
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
book_bp = Blueprint("books", __name__, url_prefix="/api/books")
cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")
order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")
category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")
author_bp = Blueprint("authors", __name__, url_prefix="/api/authors")

# Import routes to register with blueprints
from . import auth_routes, book_routes, order_routes, category_routes, author_routes  # noqa: F401
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
