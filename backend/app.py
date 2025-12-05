<<<<<<< HEAD
from flask import Flask, jsonify
from flask_cors import CORS
=======
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e

# Import blueprints
from routes.auth_routes import auth_bp
from routes.book_routes import book_bp
from routes.cart_routes import cart_bp
from routes.order_routes import order_bp
<<<<<<< HEAD

app = Flask(__name__)
=======
from routes.category_routes import category_bp
from routes.author_routes import author_bp
from routes.cart_routes import cart_bp
from routes.discount_routes import discount_bp

# Get the absolute path to the frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR)
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

<<<<<<< HEAD
# OR more permissive:
CORS(app, supports_credentials=True)

# Register blueprints
=======
# Register blueprints (they already have /api prefix in their definitions)
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
app.register_blueprint(auth_bp)
app.register_blueprint(book_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(order_bp)
<<<<<<< HEAD

@app.get("/")
def index():
    return jsonify({"message": "Bookstore API is running"})
=======
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
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e

if __name__ == "__main__":
    app.run(debug=True)
    