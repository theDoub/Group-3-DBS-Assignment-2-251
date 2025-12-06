from flask import Blueprint, jsonify, request
from db import query_all, get_connection

author_bp = Blueprint('author', __name__, url_prefix='/api/authors')

@author_bp.get("")
def list_authors():
    """Get all authors with their information."""
    print("[list_authors] Fetching all authors")
    
    sql = """
        SELECT 
            A.AuthorID,
            A.Name,
            A.Biography,
            A.Nationality,
            COUNT(DISTINCT BA.BookID) AS TotalBooks
        FROM Author A
        LEFT JOIN BookAuthor BA ON A.AuthorID = BA.AuthorID
        GROUP BY A.AuthorID, A.Name, A.Biography, A.Nationality
        ORDER BY A.Name ASC
    """
    
    try:
        authors = query_all(sql)
        print(f"[list_authors] Retrieved {len(authors)} authors")
        return jsonify(authors), 200
    except Exception as e:
        print(f"[list_authors] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@author_bp.get("/top-selling")
def get_top_selling_authors():
    """Get top selling authors using stored procedure."""
    print("[get_top_selling_authors] Fetching top selling authors")
    
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('GetTopSellingAuthors', [10])
        
        # Get the result set from the procedure
        authors = []
        for result in cursor.stored_results():
            authors = result.fetchall()
        
        conn.commit()
        cursor.close()
        
        print(f"[get_top_selling_authors] Retrieved {len(authors)} top authors")
        return jsonify(authors), 200
    except Exception as e:
        print(f"[get_top_selling_authors] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    


    
##### Publisher Routes #####
@author_bp.get("/publishers")
def list_publishers():
    """Get publishers along with their editions (published books), books and authors."""
    print("[list_publishers] Fetching publishers")
    
    sql = """
        SELECT
            P.PublisherID,
            P.Name AS PublisherName,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'Email', C.Email,
                    'PhoneNumber', C.PhoneNumber,
                    'Address', C.Address
                )
            ) AS Contacts,
            COUNT(DISTINCT E.EditionID) AS TotalBooksPublished
        FROM Publisher P
        LEFT JOIN Edition E ON P.PublisherID = E.PublisherID
        LEFT JOIN Contact C ON P.PublisherID = C.PublisherID
        GROUP BY P.PublisherID, P.Name
        ORDER BY P.Name ASC
    """
    
    try:
        publishers = query_all(sql)
        print(f"[list_publishers] Retrieved {len(publishers)} publishers")
        return jsonify(publishers), 200
    except Exception as e:
        print(f"[list_publishers] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500








