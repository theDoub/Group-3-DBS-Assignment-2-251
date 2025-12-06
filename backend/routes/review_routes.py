# routes/review_routes.py

from flask import Blueprint, request, jsonify
from db import query_all, query_one, execute, get_connection

review_bp = Blueprint('review', __name__, url_prefix='/api/reviews')

@review_bp.get("/book/<book_id>")
def get_book_reviews(book_id):
    """Get all reviews for a specific book using stored procedure."""
    print(f"[get_book_reviews] Fetching reviews for book {book_id}")
    
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('GetReviewsForBookSorted', [book_id])
        
        reviews = []
        for result in cursor.stored_results():
            reviews = result.fetchall()
        
        cursor.close()
        
        print(f"[get_book_reviews] Retrieved {len(reviews)} reviews")
        return jsonify(reviews), 200
    except Exception as e:
        print(f"[get_book_reviews] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@review_bp.get("/book/<book_id>/average")
def get_book_average_rating(book_id):
    """Get average rating for a book."""
    print(f"[get_book_average_rating] Fetching average rating for book {book_id}")
    
    sql = """
        SELECT 
            COALESCE(AVG(R.Rating), 0) as AverageRating,
            COUNT(R.ReviewID) as TotalReviews
        FROM Review R
        JOIN OrderItem OI ON R.OrderNo = OI.OrderNo AND R.OrderID = OI.OrderID
        JOIN Format F ON OI.FormatID = F.FormatID
        JOIN Edition E ON F.EditionID = E.EditionID
        WHERE E.BookID = %s
    """
    
    try:
        result = query_one(sql, [book_id])
        return jsonify(result), 200
    except Exception as e:
        print(f"[get_book_average_rating] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@review_bp.post("")
def create_review():
    """Create a new review for a purchased book."""
    data = request.get_json() or {}
    
    order_id = data.get("orderId")
    order_no = data.get("orderNo")
    rating = data.get("rating")
    comment = data.get("comment", "")
    account_id = data.get("accountId")
    
    if not all([order_id, order_no, rating, account_id]):
        return jsonify({"error": "orderId, orderNo, rating, and accountId are required"}), 400
    
    if not (1 <= rating <= 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400
    
    print(f"[create_review] Creating review for Order {order_id}, OrderNo {order_no}")
    
    # Verify the order belongs to the user
    verify_sql = """
        SELECT O.OrderID 
        FROM `Order` O
        WHERE O.OrderID = %s AND O.AccountID = %s
    """
    order = query_one(verify_sql, [order_id, account_id])
    
    if not order:
        return jsonify({"error": "Order not found or does not belong to this account"}), 403
    
    # Check if review already exists
    check_sql = "SELECT ReviewID FROM Review WHERE OrderID = %s AND OrderNo = %s"
    existing = query_one(check_sql, [order_id, order_no])
    
    if existing:
        return jsonify({"error": "You have already reviewed this item"}), 400
    
    # Insert review (trigger will validate payment status and date)
    insert_sql = """
        INSERT INTO Review (OrderNo, OrderID, Rating, Comment, ReviewDate)
        VALUES (%s, %s, %s, %s, NOW())
    """
    
    try:
        execute(insert_sql, [order_no, order_id, rating, comment])
        return jsonify({"message": "Review submitted successfully"}), 201
    except Exception as e:
        error_msg = str(e)
        print(f"[create_review] Error: {error_msg}")
        
        # Handle trigger validation errors
        if "Payment.Status must be" in error_msg:
            return jsonify({"error": "Cannot review: Payment must be completed first"}), 400
        elif "Review Date must be after" in error_msg:
            return jsonify({"error": "Cannot review: Review date must be after order date"}), 400
        else:
            return jsonify({"error": error_msg}), 500

@review_bp.get("/user/<account_id>")
def get_user_reviews(account_id):
    """Get all reviews submitted by a specific user."""
    print(f"[get_user_reviews] Fetching reviews for user {account_id}")
    
    sql = """
        SELECT 
            R.ReviewID,
            R.OrderNo,
            R.OrderID,
            R.Rating,
            R.Comment,
            R.ReviewDate,
            B.Title as BookTitle,
            B.BookID
        FROM Review R
        JOIN OrderItem OI ON R.OrderNo = OI.OrderNo AND R.OrderID = OI.OrderID
        JOIN Format F ON OI.FormatID = F.FormatID
        JOIN Edition E ON F.EditionID = E.EditionID
        JOIN Book B ON E.BookID = B.BookID
        JOIN `Order` O ON R.OrderID = O.OrderID
        WHERE O.AccountID = %s
        ORDER BY R.ReviewDate DESC
    """
    
    try:
        reviews = query_all(sql, [account_id])
        return jsonify(reviews), 200
    except Exception as e:
        print(f"[get_user_reviews] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@review_bp.get("/order/<order_id>/items")
def get_reviewable_items(order_id):
    """Get all items in an order that can be reviewed."""
    print(f"[get_reviewable_items] Fetching reviewable items for order {order_id}")
    
    sql = """
        SELECT 
            OI.OrderNo,
            OI.OrderID,
            B.Title as BookTitle,
            B.BookID,
            F.FormatType,
            P.Status as PaymentStatus,
            O.OrderDate,
            R.ReviewID as AlreadyReviewed
        FROM OrderItem OI
        JOIN Format F ON OI.FormatID = F.FormatID
        JOIN Edition E ON F.EditionID = E.EditionID
        JOIN Book B ON E.BookID = B.BookID
        JOIN `Order` O ON OI.OrderID = O.OrderID
        LEFT JOIN Payment P ON O.OrderID = P.OrderID
        LEFT JOIN Review R ON OI.OrderNo = R.OrderNo AND OI.OrderID = R.OrderID
        WHERE OI.OrderID = %s
        ORDER BY OI.OrderNo
    """
    
    try:
        items = query_all(sql, [order_id])
        return jsonify(items), 200
    except Exception as e:
        print(f"[get_reviewable_items] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Get all reviews (Admin only)
@review_bp.route('/all', methods=['GET'])
def get_all_reviews():
    """
    Get all reviews across all books with customer and book information
    Admin endpoint for review management
    """
    try:
        query = """
            SELECT 
                r.ReviewID,
                r.OrderNo,
                r.OrderID,
                r.Rating,
                r.Comment,
                r.ReviewDate,
                b.Title as BookTitle,
                b.BookID,
                ca.Name as CustomerName,
                a.AccountID
            FROM Review r
            JOIN OrderItem oi ON r.OrderNo = oi.OrderNo AND r.OrderID = oi.OrderID
            JOIN Format f ON oi.FormatID = f.FormatID
            JOIN Edition e ON f.EditionID = e.EditionID
            JOIN Book b ON e.BookID = b.BookID
            JOIN `Order` o ON r.OrderID = o.OrderID
            JOIN Account a ON o.AccountID = a.AccountID
            JOIN CustomerAccount ca ON a.AccountID = ca.AccountID
            ORDER BY r.ReviewDate DESC
        """
        
        reviews = query_all(query)
        return jsonify(reviews), 200
    except Exception as e:
        print(f"[get_all_reviews] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
