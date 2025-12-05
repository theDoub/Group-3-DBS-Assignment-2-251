# routes/book_routes.py

from flask import request, jsonify
from routes import book_bp
from db import query_all, query_one, execute

@book_bp.get("")
def list_books():
    """
<<<<<<< HEAD
    Trả về danh sách books kèm theo Price riêng cho từng Format, Author, Publisher, Weight, Contact, và Audio duration.
=======
    Trả về danh sách books kèm theo Price riêng cho từng Format.
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
    """
    category_name = request.args.get("category")
    sort = request.args.get("sort")

<<<<<<< HEAD
    # Sửa query: Thêm Publisher, Weight, Contact, Category info
=======
    # Sửa query: Thêm 'Price', E.Price vào JSON Object
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
    base_sql = """
        SELECT 
            B.BookID,
            B.Title,
            B.Description,
            MIN(E.Price) AS MinPrice,
            GROUP_CONCAT(DISTINCT C.Name ORDER BY C.Name SEPARATOR ', ') AS Categories,
<<<<<<< HEAD
            GROUP_CONCAT(DISTINCT A.Name SEPARATOR ', ') AS Authors,
            GROUP_CONCAT(DISTINCT Pub.Name SEPARATOR ', ') AS Publishers,
=======
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'FormatID', F.FormatID, 
                    'FormatType', F.FormatType,
<<<<<<< HEAD
                    'Price', E.Price,
                    'AudioDuration', AB.TotalDuration,
                    'PageCount', PB.NumberOfPage,
                    'Weight', PB.Weight,
                    'EBookFormat', EB.FileStandard,
                    'PublisherName', Pub.Name,
                    'PublicationDate', E.PublicationDate
                )
            ) AS Formats,
            GROUP_CONCAT(DISTINCT CONCAT('Email: ', Con.Email, ' | Phone: ', Con.PhoneNumber) SEPARATOR ' | ') AS Contact
=======
                    'Price', E.Price
                )
            ) AS Formats
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
        FROM Book B
        LEFT JOIN Edition E ON B.BookID = E.BookID
        LEFT JOIN Format F ON E.EditionID = F.EditionID
        LEFT JOIN BookCategory BC ON B.BookID = BC.BookID
        LEFT JOIN Category C ON BC.CategoryID = C.CategoryID
<<<<<<< HEAD
        LEFT JOIN BookAuthor BA ON B.BookID = BA.BookID
        LEFT JOIN Author A ON BA.AuthorID = A.AuthorID
        LEFT JOIN Publisher Pub ON E.PublisherID = Pub.PublisherID
        LEFT JOIN Contact Con ON Pub.PublisherID = Con.PublisherID
        LEFT JOIN PrintedBook PB ON F.FormatID = PB.FormatID
        LEFT JOIN EBook EB ON F.FormatID = EB.FormatID
        LEFT JOIN AudioBook AB ON F.FormatID = AB.FormatID
=======
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
    """

    params = []
    conditions = []

    if category_name:
        conditions.append("C.Name = %s")
        params.append(category_name)

    if conditions:
        base_sql += " WHERE " + " AND ".join(conditions)

    base_sql += " GROUP BY B.BookID, B.Title, B.Description "

    if sort == "price_asc":
        base_sql += " ORDER BY MinPrice ASC "
    elif sort == "price_desc":
        base_sql += " ORDER BY MinPrice DESC "
    elif sort == "title_desc":
        base_sql += " ORDER BY B.Title DESC "
    else:
        base_sql += " ORDER BY B.Title ASC "

    rows = query_all(base_sql, params)
    return jsonify(rows)


@book_bp.get("/<book_id>")
def get_book_detail(book_id):
    sql = """
        SELECT 
            B.BookID,
            B.Title,
            B.Description,
            MIN(E.Price) AS MinPrice,
<<<<<<< HEAD
            GROUP_CONCAT(DISTINCT C.Name ORDER BY C.Name SEPARATOR ', ') AS Categories
=======
            GROUP_CONCAT(DISTINCT C.Name ORDER BY C.Name SEPARATOR ', ') AS Categories,
            GROUP_CONCAT(DISTINCT A.Name ORDER BY A.Name SEPARATOR ', ') AS Authors
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
        FROM Book B
        LEFT JOIN Edition E ON B.BookID = E.BookID
        LEFT JOIN BookCategory BC ON B.BookID = BC.BookID
        LEFT JOIN Category C ON BC.CategoryID = C.CategoryID
<<<<<<< HEAD
=======
        LEFT JOIN BookAuthor BA ON B.BookID = BA.BookID
        LEFT JOIN Author A ON BA.AuthorID = A.AuthorID
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
        WHERE B.BookID = %s
        GROUP BY B.BookID, B.Title, B.Description
    """
    row = query_one(sql, [book_id])
    if not row:
        return jsonify({"error": "Book not found"}), 404
<<<<<<< HEAD
=======
    
    # Get category IDs
    cat_sql = "SELECT CategoryID FROM BookCategory WHERE BookID = %s"
    cat_rows = query_all(cat_sql, [book_id])
    row['CategoryIDs'] = [r['CategoryID'] for r in cat_rows]
    
    # Get author IDs
    author_sql = "SELECT AuthorID FROM BookAuthor WHERE BookID = %s"
    author_rows = query_all(author_sql, [book_id])
    row['AuthorIDs'] = [r['AuthorID'] for r in author_rows]
    
    # Get first available format ID for this book
    format_sql = """
        SELECT f.FormatID 
        FROM Format f
        JOIN Edition e ON f.EditionID = e.EditionID
        WHERE e.BookID = %s
        LIMIT 1
    """
    format_row = query_one(format_sql, [book_id])
    row['FormatID'] = format_row['FormatID'] if format_row else None
    
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
    return jsonify(row)


@book_bp.post("")
def create_book():
    """
<<<<<<< HEAD
    Tạo sách mới
=======
    Tạo sách mới (Book).
    Trigger trg_book_before_insert sẽ tự sinh BookID.
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
    """
    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description")
<<<<<<< HEAD
=======
    categories = data.get("categories", [])  # List of CategoryIDs
    authors = data.get("authors", [])  # List of AuthorIDs
    price = data.get("price")
    publisher_id = data.get("publisher_id", 1)  # Default publisher
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e

    if not title:
        return jsonify({"error": "title is required"}), 400

<<<<<<< HEAD
    sql = "INSERT INTO Book (Title, Description) VALUES (%s, %s)"
    execute(sql, [title, description])
=======
    # Insert Book
    sql = "INSERT INTO Book (Title, Description) VALUES (%s, %s)"
    execute(sql, [title, description])
    # Không lấy lại BookID trực tiếp từ lastrowid vì PK là varchar.
    # Mình trả về message đơn giản (hoặc có thể query lại theo title).
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
    return jsonify({"message": "Book created (BookID generated by trigger)"}), 201


@book_bp.put("/<book_id>")
def update_book(book_id):
    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description")
<<<<<<< HEAD
=======
    categories = data.get("categories")  # List of CategoryIDs
    authors = data.get("authors")  # List of AuthorIDs
    price = data.get("price")
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e

    exist = query_one("SELECT BookID FROM Book WHERE BookID = %s", [book_id])
    if not exist:
        return jsonify({"error": "Book not found"}), 404

<<<<<<< HEAD
    sql = "UPDATE Book SET Title = %s, Description = %s WHERE BookID = %s"
    execute(sql, [title, description, book_id])
=======
    # Update Book
    sql = "UPDATE Book SET Title = %s, Description = %s WHERE BookID = %s"
    execute(sql, [title, description, book_id])
    
    # Update categories if provided
    if categories is not None:
        # Delete existing categories
        execute("DELETE FROM BookCategory WHERE BookID = %s", [book_id])
        # Insert new categories
        for cat_id in categories:
            execute("INSERT INTO BookCategory (BookID, CategoryID) VALUES (%s, %s)", [book_id, cat_id])
    
    # Update authors if provided
    if authors is not None:
        # Delete existing authors
        execute("DELETE FROM BookAuthor WHERE BookID = %s", [book_id])
        # Insert new authors
        for author_id in authors:
            execute("INSERT INTO BookAuthor (BookID, AuthorID) VALUES (%s, %s)", [book_id, author_id])
    
    # Update price in the first edition if provided
    if price:
        edition = query_one("SELECT EditionID FROM Edition WHERE BookID = %s LIMIT 1", [book_id])
        if edition:
            execute("UPDATE Edition SET Price = %s WHERE EditionID = %s", [price, edition['EditionID']])
        else:
            # Create new edition with price
            execute(
                "INSERT INTO Edition (BookID, PublisherID, PublicationDate, Price, Language) VALUES (%s, %s, NOW(), %s, 'Vietnamese')",
                [book_id, 1, price]
            )
    
>>>>>>> 9b5acd6ab9fa3af5b6ff8329ba9b5886043d043e
    return jsonify({"message": "Book updated"})


@book_bp.delete("/<book_id>")
def delete_book(book_id):
    exist = query_one("SELECT BookID FROM Book WHERE BookID = %s", [book_id])
    if not exist:
        return jsonify({"error": "Book not found"}), 404

    sql = "DELETE FROM Book WHERE BookID = %s"
    execute(sql, [book_id])
    return jsonify({"message": "Book deleted"})