# routes/book_routes.py

from flask import request, jsonify
from routes import book_bp
from db import query_all, query_one, execute


@book_bp.get("")
def list_books():
    """
    Trả về danh sách books, có:
      - filter theo category name: ?category=Fantasy
      - sort theo price hoặc title:
           ?sort=price_asc | price_desc | title_asc | title_desc
    Sử dụng join >= 2 bảng => đáp ứng yêu cầu đề bài.
    """
    category_name = request.args.get("category")
    sort = request.args.get("sort")

    base_sql = """
        SELECT 
            B.BookID,
            B.Title,
            B.Description,
            MIN(E.Price) AS MinPrice,
            GROUP_CONCAT(DISTINCT C.Name ORDER BY C.Name SEPARATOR ', ') AS Categories
        FROM Book B
        LEFT JOIN Edition E ON B.BookID = E.BookID
        LEFT JOIN BookCategory BC ON B.BookID = BC.BookID
        LEFT JOIN Category C ON BC.CategoryID = C.CategoryID
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
    else:  # default
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
            GROUP_CONCAT(DISTINCT C.Name ORDER BY C.Name SEPARATOR ', ') AS Categories,
            GROUP_CONCAT(DISTINCT A.Name ORDER BY A.Name SEPARATOR ', ') AS Authors
        FROM Book B
        LEFT JOIN Edition E ON B.BookID = E.BookID
        LEFT JOIN BookCategory BC ON B.BookID = BC.BookID
        LEFT JOIN Category C ON BC.CategoryID = C.CategoryID
        LEFT JOIN BookAuthor BA ON B.BookID = BA.BookID
        LEFT JOIN Author A ON BA.AuthorID = A.AuthorID
        WHERE B.BookID = %s
        GROUP BY B.BookID, B.Title, B.Description
    """
    row = query_one(sql, [book_id])
    if not row:
        return jsonify({"error": "Book not found"}), 404
    
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
    
    return jsonify(row)


@book_bp.post("")
def create_book():
    """
    Tạo sách mới (Book) kèm category, author, và price.
    Trigger trg_book_before_insert sẽ tự sinh BookID.
    """
    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description")
    categories = data.get("categories", [])  # List of CategoryIDs
    authors = data.get("authors", [])  # List of AuthorIDs
    price = data.get("price")
    publisher_id = data.get("publisher_id", 1)  # Default publisher

    if not title:
        return jsonify({"error": "title is required"}), 400

    # Insert Book
    sql = "INSERT INTO Book (Title, Description) VALUES (%s, %s)"
    execute(sql, [title, description])
    
    # Get the newly created BookID
    book_row = query_one("SELECT BookID FROM Book WHERE Title = %s ORDER BY BookID DESC LIMIT 1", [title])
    if not book_row:
        return jsonify({"error": "Failed to create book"}), 500
    
    book_id = book_row['BookID']
    
    # Insert BookCategory
    if categories:
        for cat_id in categories:
            execute("INSERT INTO BookCategory (BookID, CategoryID) VALUES (%s, %s)", [book_id, cat_id])
    
    # Insert BookAuthor
    if authors:
        for author_id in authors:
            execute("INSERT INTO BookAuthor (BookID, AuthorID) VALUES (%s, %s)", [book_id, author_id])
    
    # Create Edition with price if provided
    if price:
        execute(
            "INSERT INTO Edition (BookID, PublisherID, PublicationDate, Price, Language) VALUES (%s, %s, NOW(), %s, 'Vietnamese')",
            [book_id, publisher_id, price]
        )
    
    return jsonify({"message": "Book created successfully", "bookId": book_id}), 201


@book_bp.put("/<book_id>")
def update_book(book_id):
    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description")
    categories = data.get("categories")  # List of CategoryIDs
    authors = data.get("authors")  # List of AuthorIDs
    price = data.get("price")

    # Check tồn tại
    exist = query_one("SELECT BookID FROM Book WHERE BookID = %s", [book_id])
    if not exist:
        return jsonify({"error": "Book not found"}), 404

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
    
    return jsonify({"message": "Book updated"})


@book_bp.delete("/<book_id>")
def delete_book(book_id):
    exist = query_one("SELECT BookID FROM Book WHERE BookID = %s", [book_id])
    if not exist:
        return jsonify({"error": "Book not found"}), 404

    sql = "DELETE FROM Book WHERE BookID = %s"
    execute(sql, [book_id])
    return jsonify({"message": "Book deleted"})
