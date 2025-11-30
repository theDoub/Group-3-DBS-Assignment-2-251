from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

# Import blueprints
from routes.auth_routes import auth_bp
from routes.book_routes import book_bp
from routes.cart_routes import cart_bp
from routes.order_routes import order_bp
from routes.category_routes import category_bp
from routes.author_routes import author_bp
from routes.cart_routes import cart_bp
from routes.discount_routes import discount_bp

# Get the absolute path to the frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Register blueprints (they already have /api prefix in their definitions)
app.register_blueprint(auth_bp)
app.register_blueprint(book_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(order_bp)
app.register_blueprint(category_bp)
app.register_blueprint(author_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(discount_bp)

# Serve frontend files
@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Check if file exists in frontend directory
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    # If not, serve index.html for SPA routing
    return send_from_directory(FRONTEND_DIR, 'index.html')

if __name__ == "__main__":
    app.run(debug=True)
    