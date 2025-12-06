from flask import Blueprint, jsonify, request
from db import query_all, get_connection, query_one, execute

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

##### Book Routes #####
@admin_bp.post("/books")
def create_book():
    """Create a new book with edition and format."""
    data = request.get_json()

    print(f"[create_book] Received data: {data}")
    
    if not data.get('Title'):
        return jsonify({"error": "Book title is required"}), 400
    if not data.get('EditionPrice'):
        return jsonify({"error": "Edition price is required"}), 400
    if not data.get('FormatType'):
        return jsonify({"error": "Format type is required"}), 400
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Insert into Book table
        insert_book_sql = "INSERT INTO Book (Title, Description) VALUES (%s, %s)"
        cursor.execute(insert_book_sql, (
            data.get('Title'),
            data.get('Description')
        ))
        # executed, get the inserted BookID
        conn.commit()

        # Get the last inserted BookID by querying the last row
        get_book_id_sql = "SELECT BookID FROM Book ORDER BY BookID DESC LIMIT 1"
        cursor.execute(get_book_id_sql)
        result = cursor.fetchone()
        book_id = result[0] if result else None

        print(f"[create_book] Book inserted with ID: {book_id}")

        if not book_id:
            return jsonify({"error": "Failed to get Book ID"}), 500
        
        # 2. Insert into Edition table (linked to Book)
        insert_edition_sql = "INSERT INTO Edition (BookID, Language, Price, PublisherID) VALUES (%s, %s, %s, %s)"
        cursor.execute(insert_edition_sql, (
            book_id,
            data.get('EditionLanguage') or 'English',
            data.get('EditionPrice'),
            data.get('PublisherID')
        ))
        conn.commit()
        # Get the last inserted EditionID
        get_edition_id_sql = "SELECT EditionID FROM Edition WHERE BookID = %s ORDER BY EditionID DESC LIMIT 1"
        cursor.execute(get_edition_id_sql, (book_id,))
        result = cursor.fetchone()
        edition_id = result[0] if result else None
        
        # 3. Insert into Format table (linked to Edition)
        insert_format_sql = "INSERT INTO Format (EditionID, FormatType) VALUES (%s, %s)"
        cursor.execute(insert_format_sql, (
            edition_id,
            data.get('FormatType')
        ))

        # 4. Insert into BookCategory table if categories provided
        category_id = data.get('CategoryID')  # One CategoryID
        if category_id:
            insert_book_category_sql = "INSERT INTO BookCategory (BookID, CategoryID) VALUES (%s, %s)"
            cursor.execute(insert_book_category_sql, (book_id, category_id))
        
        conn.commit()
        cursor.close()
        
        print(f"[create_book] Book created with ID: {book_id}, Edition ID: {edition_id}")
        return jsonify({"BookID": book_id, "EditionID": edition_id, "message": "Book created successfully"}), 201
    except Exception as e:
        conn.rollback()
        print(f"[create_book] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@admin_bp.put("/books/<book_id>")
def update_book(book_id):
    """Update a book and its edition."""
    data = request.get_json()
    
    if not data.get('Title'):
        return jsonify({"error": "Book title is required"}), 400
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Update Book table
        update_book_sql = "UPDATE Book SET Title = %s, Description = %s WHERE BookID = %s"
        cursor.execute(update_book_sql, (
            data.get('Title'),
            data.get('Description'),
            book_id
        ))
        
        # Update Edition if EditionID provided
        if data.get('EditionID'):
            update_edition_sql = "UPDATE Edition SET Language = %s, Price = %s WHERE EditionID = %s"
            cursor.execute(update_edition_sql, (
                data.get('EditionLanguage') or 'English',
                data.get('EditionPrice'),
                data.get('EditionID')
            ))
            
        # Update Format if FormatType provided
        if data.get('FormatType'):
            update_format_sql = "UPDATE Format SET FormatType = %s WHERE EditionID = %s"
            cursor.execute(update_format_sql, (
                data.get('FormatType'),
                data.get('EditionID')
            ))

        if data.get('CategoryID'):
            # Update CategoryID in BookCategory table
            update_book_category_sql = "UPDATE BookCategory SET CategoryID = %s WHERE BookID = %s"
            cursor.execute(update_book_category_sql, (
                data.get('CategoryID'),
                book_id
            ))
        
        conn.commit()
        cursor.close()
        
        print(f"[update_book] Book {book_id} updated successfully")
        return jsonify({"message": "Book updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        print(f"[update_book] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@admin_bp.delete("/books/<int:book_id>")
def delete_book(book_id):
    """Delete a book and all related editions and formats."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Get all editions for this book
        get_editions_sql = "SELECT EditionID FROM Edition WHERE BookID = %s"
        cursor.execute(get_editions_sql, (book_id,))
        editions = cursor.fetchall()
        
        # Delete all formats for each edition
        for edition in editions:
            delete_formats_sql = "DELETE FROM Format WHERE EditionID = %s"
            cursor.execute(delete_formats_sql, (edition[0],))
        
        # Delete all editions
        delete_editions_sql = "DELETE FROM Edition WHERE BookID = %s"
        cursor.execute(delete_editions_sql, (book_id,))
        
        # Delete the book
        delete_book_sql = "DELETE FROM Book WHERE BookID = %s"
        cursor.execute(delete_book_sql, (book_id,))
        
        conn.commit()
        cursor.close()
        
        print(f"[delete_book] Book {book_id} and all related data deleted successfully")
        return jsonify({"message": "Book deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        print(f"[delete_book] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()



##### Publisher Routes #####
@admin_bp.post("/publishers")
def create_publisher():
    """Create a new publisher with contact information."""
    data = request.get_json()
    
    if not data.get('Name'):
        return jsonify({"error": "Publisher name is required"}), 400
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Insert publisher
        insert_publisher_sql = "INSERT INTO Publisher (Name) VALUES (%s)"
        cursor.execute(insert_publisher_sql, (data.get('Name'),))
        publisher_id = cursor.lastrowid
        
        # Insert contact if provided
        if data.get('Email') or data.get('PhoneNumber') or data.get('Address'):
            insert_contact_sql = "INSERT INTO Contact (PublisherID, Email, PhoneNumber, Address) VALUES (%s, %s, %s, %s)"
            cursor.execute(insert_contact_sql, (
                publisher_id,
                data.get('Email'),
                data.get('PhoneNumber'),
                data.get('Address')
            ))
        
        conn.commit()
        cursor.close()
        
        print(f"[create_publisher] Publisher created with ID: {publisher_id}")
        return jsonify({"PublisherID": publisher_id, "message": "Publisher created successfully"}), 201
    except Exception as e:
        conn.rollback()
        print(f"[create_publisher] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@admin_bp.put("/publishers/<int:publisher_id>")
def update_publisher(publisher_id):
    """Update a publisher and its contact information."""
    data = request.get_json()
    
    if not data.get('Name'):
        return jsonify({"error": "Publisher name is required"}), 400
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Update publisher name
        update_publisher_sql = "UPDATE Publisher SET Name = %s WHERE PublisherID = %s"
        cursor.execute(update_publisher_sql, (data.get('Name'), publisher_id))
        
        # Update or insert contact
        check_contact_sql = "SELECT ContactID FROM Contact WHERE PublisherID = %s LIMIT 1"
        cursor.execute(check_contact_sql, (publisher_id,))
        contact = cursor.fetchone()
        
        if contact:
            # Update existing contact
            update_contact_sql = "UPDATE Contact SET Email = %s, PhoneNumber = %s, Address = %s WHERE PublisherID = %s"
            cursor.execute(update_contact_sql, (
                data.get('Email'),
                data.get('PhoneNumber'),
                data.get('Address'),
                publisher_id
            ))
        else:
            # Insert new contact if it doesn't exist
            if data.get('Email') or data.get('PhoneNumber') or data.get('Address'):
                insert_contact_sql = "INSERT INTO Contact (PublisherID, Email, PhoneNumber, Address) VALUES (%s, %s, %s, %s)"
                cursor.execute(insert_contact_sql, (
                    publisher_id,
                    data.get('Email'),
                    data.get('PhoneNumber'),
                    data.get('Address')
                ))
        
        conn.commit()
        cursor.close()
        
        print(f"[update_publisher] Publisher {publisher_id} updated successfully")
        return jsonify({"message": "Publisher updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        print(f"[update_publisher] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@admin_bp.delete("/publishers/<int:publisher_id>")
def delete_publisher(publisher_id):
    """Delete a publisher and its associated contacts."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Delete contacts first (foreign key constraint)
        delete_contacts_sql = "DELETE FROM Contact WHERE PublisherID = %s"
        cursor.execute(delete_contacts_sql, (publisher_id,))
        
        # Delete publisher
        delete_publisher_sql = "DELETE FROM Publisher WHERE PublisherID = %s"
        cursor.execute(delete_publisher_sql, (publisher_id,))
        
        conn.commit()
        cursor.close()
        
        print(f"[delete_publisher] Publisher {publisher_id} deleted successfully")
        return jsonify({"message": "Publisher deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        print(f"[delete_publisher] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

##### Author Routes #####
@admin_bp.post("/authors")
def create_author():
    """Create a new author."""
    data = request.get_json()

    print(f"[create_author] Received data: {data}")
    
    if not data.get('Name'):
        return jsonify({"error": "Author name is required"}), 400
    
    sql = "INSERT INTO Author (Name, Biography, Nationality) VALUES (%s, %s, %s)"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, (data.get('Name'), data.get('Biography'), data.get('Nationality')))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Author created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.put("/authors/<int:author_id>")
def update_author(author_id):
    """Update an author."""
    data = request.get_json()
    
    if not data.get('Name'):
        return jsonify({"error": "Author name is required"}), 400
    
    sql = "UPDATE Author SET Name = %s, Biography = %s, Nationality = %s WHERE AuthorID = %s"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, (data.get('Name'), data.get('Biography'), data.get('Nationality'), author_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Author updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.delete("/authors/<int:author_id>")
def delete_author(author_id):
    """Delete an author."""
    sql = "DELETE FROM Author WHERE AuthorID = %s"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, (author_id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Author deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


##### Payment Routes #####
@admin_bp.get("/payments")
def list_pending_payments():
    """
    ADMIN ONLY: Get all pending payments
    """
    sql = """
        SELECT 
            P.PaymentID,
            P.OrderID,
            P.TotalAmount,
            P.Method,
            P.PaymentDate,
            P.Status,
            CA.Name AS CustomerName
        FROM Payment P
        JOIN `Order` O ON P.OrderID = O.OrderID
        JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
        WHERE P.Status = 'pending'
        ORDER BY P.PaymentDate DESC
    """
    payments = query_all(sql)
    return jsonify(payments)


@admin_bp.put("/payments/<payment_id>/approve")
def approve_payment(payment_id):
    """
    ADMIN ONLY: Approve a payment and confirm the order
    """
    data = request.get_json() or {}
    admin_account_id = data.get("adminAccountId")
    
    print(f"[approve_payment] Admin {admin_account_id} approving payment {payment_id}")
    
    # Get payment and order info
    payment = query_one(
        "SELECT PaymentID, OrderID, TotalAmount FROM Payment WHERE PaymentID = %s",
        [payment_id]
    )
    
    if not payment:
        return jsonify({"error": "Payment not found"}), 404
    
    order_id = payment['OrderID']

    # Check if order contains printed books
    printed_items = query_all(
        """
        SELECT OI.OrderNo, F.FormatType
        FROM OrderItem OI
        JOIN Format F ON OI.FormatID = F.FormatID
        WHERE OI.OrderID = %s AND F.FormatType = 'Printed'
        """,
        [order_id]
    )

    has_printed = len(printed_items) > 0
    print(f"[approve_payment] Order {order_id} has printed items: {has_printed}")


    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Update payment status
        cursor.execute(
            "UPDATE Payment SET Status = 'completed' WHERE PaymentID = %s",
            [payment_id]
        )
        
        # Update order status to confirmed
        cursor.execute(
            "UPDATE `Order` SET Status = 'confirmed' WHERE OrderID = %s",
            [payment['OrderID']]
        )

         # If order has printed books, create delivery record
        if has_printed:
            cursor.execute(
                """
                INSERT INTO Delivery (OrderID, Status, ExpectedShippingDate)
                VALUES (%s, 'delivering', DATE_ADD(NOW(), INTERVAL 3 DAY))
                """,
                [order_id]
            )
            print(f"[approve_payment] Created delivery record for Order {order_id}")
        
        conn.commit()
        
        print(f"[approve_payment] Payment {payment_id} approved, Order {payment['OrderID']} confirmed")
        
        return jsonify({
            "message": "Payment approved and order confirmed",
            "paymentId": payment_id,
            "orderId": payment['OrderID'],
            "deliveryCreated": has_printed
        }), 200
    
    except Exception as e:
        conn.rollback()
        print(f"[approve_payment] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
       
        
    finally:
        cursor.close()
        conn.close()



##### Delivery Routes #####
@admin_bp.get("/deliveries")
def list_deliveries():
    """
    ADMIN ONLY: Get all deliveries
    """
    sql = """
        SELECT 
            D.DeliveryID,
            D.OrderID,
            D.Status,
            D.Carrier,
            D.TrackingNumber,
            D.ExpectedShippingDate,
            CA.Name AS CustomerName
        FROM Delivery D
        JOIN `Order` O ON D.OrderID = O.OrderID
        JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
        ORDER BY D.ExpectedShippingDate ASC
    """
    deliveries = query_all(sql)
    return jsonify(deliveries)


@admin_bp.put("/deliveries/<delivery_id>")
def update_delivery(delivery_id):
    """
    ADMIN ONLY: Update delivery status
    """
    data = request.get_json() or {}
    new_status = data.get("status")
    admin_account_id = data.get("adminAccountId")
    
    if not new_status:
        return jsonify({"error": "status required"}), 400
    
    valid_statuses = ['preparing', 'shipped', 'delivering', 'delivered', 'failed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400
    
    print(f"[update_delivery] Admin {admin_account_id} updating delivery {delivery_id} to {new_status}")
    
    execute(
        "UPDATE Delivery SET Status = %s WHERE DeliveryID = %s",
        [new_status, delivery_id]
    )
    
    return jsonify({
        "message": f"Delivery status updated to {new_status}",
        "deliveryId": delivery_id,
        "status": new_status
    }), 200

@admin_bp.get("/all")
def get_all_orders():
    """
    ADMIN ONLY: Get all orders with customer information
    Returns orders grouped by customer with order details
    """
    print("[get_all_orders] Fetching all orders with customer info")
    
    sql = """
        SELECT 
            O.OrderID,
            O.AccountID,
            O.OrderDate,
            O.Status,
            O.TotalAmount,
            CA.Name AS CustomerName,
            CA.DeliveryAddress,
            COUNT(OI.OrderNo) AS ItemCount
        FROM `Order` O
        JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
        LEFT JOIN OrderItem OI ON O.OrderID = OI.OrderID
        GROUP BY O.OrderID, O.AccountID, O.OrderDate, O.Status, O.TotalAmount, CA.Name, CA.DeliveryAddress
        ORDER BY O.OrderDate DESC
    """
    
    try:
        orders = query_all(sql)
        
        # Enrich each order with items and discount info
        for order in orders:
            # Get order items with discount details
            items_sql = """
                SELECT 
                    OI.OrderNo,
                    OI.FormatID,
                    OI.Quantity,
                    OI.PricePerItem,
                    OI.PriceAtPurchase,
                    B.Title AS BookTitle,
                    F.FormatType,
                    GROUP_CONCAT(DISTINCT D.Name ORDER BY D.Name SEPARATOR ', ') AS AppliedDiscounts
                FROM OrderItem OI
                LEFT JOIN DiscountApply DA ON OI.OrderID = DA.OrderID AND OI.OrderNo = DA.OrderNo
                LEFT JOIN Discount D ON DA.DiscountID = D.DiscountID
                JOIN Format F ON OI.FormatID = F.FormatID
                JOIN Edition E ON F.EditionID = E.EditionID
                JOIN Book B ON E.BookID = B.BookID
                WHERE OI.OrderID = %s
                GROUP BY OI.OrderNo, OI.FormatID, OI.Quantity, OI.PricePerItem, OI.PriceAtPurchase, B.Title, F.FormatType
                ORDER BY OI.OrderNo
            """
            
            items = query_all(items_sql, [order['OrderID']])
            order['items'] = items if items else []
            
            # Get payment info if exists
            payment_sql = """
                SELECT PaymentID, Method, PaymentDate, Status, TotalAmount
                FROM Payment
                WHERE OrderID = %s
                LIMIT 1
            """
            payment = query_one(payment_sql, [order['OrderID']])
            order['payment'] = payment
            
            # Get delivery info if exists
            delivery_sql = """
                SELECT DeliveryID, Status, Carrier, TrackingNumber, ExpectedShippingDate
                FROM Delivery
                WHERE OrderID = %s
                LIMIT 1
            """
            delivery = query_one(delivery_sql, [order['OrderID']])
            order['delivery'] = delivery
        
        print(f"[get_all_orders] Returning {len(orders)} orders")
        return jsonify(orders), 200
        
    except Exception as e:
        print(f"[get_all_orders] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500