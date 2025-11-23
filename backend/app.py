from flask import Flask, jsonify
from flask_cors import CORS

# Import blueprints
from routes.auth_routes import auth_bp
from routes.book_routes import book_bp
from routes.order_routes import order_bp

app = Flask(__name__)

# Enable CORS for all routes 
# CORS(app, resources={r"/*": {"origins": "*"}})

##
# Allow all origins including file:// and localhost
CORS(app, resources={r"/*": {"origins": ["*", "null"]}})

# OR more permissive:
CORS(app, supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(book_bp)
app.register_blueprint(order_bp)

@app.get("/")
def index():
    return jsonify({"message": "Bookstore API is running"})

if __name__ == "__main__":
    app.run(debug=True)
    