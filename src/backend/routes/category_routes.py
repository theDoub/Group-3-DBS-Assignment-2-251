from flask import Blueprint, jsonify
from db import query_all, query_one

category_bp = Blueprint('category', __name__, url_prefix='/api/categories')

@category_bp.get("")
def list_categories():
    """Get all parent categories (no parent) with book count."""
    print("[list_categories] Listing all parent categories")
    sql = """
        SELECT 
            C.CategoryID,
            C.Name AS CategoryName,
            C.Description,
            COUNT(DISTINCT BC.BookID) AS BookCount
        FROM Category C
        LEFT JOIN BookCategory BC ON C.CategoryID = BC.CategoryID
        WHERE C.SubcategoryID IS NULL
        GROUP BY C.CategoryID, C.Name, C.Description
        ORDER BY C.Name ASC
    """
    rows = query_all(sql)
    return jsonify(rows), 200

@category_bp.get("/<int:category_id>/sub-categories")
def list_sub_categories(category_id):
    """Get all subcategories of a particular category."""
    print(f"[list_sub_categories] Listing sub-categories for category {category_id}")
    sql = """
        SELECT 
            C.CategoryID,
            C.Name AS SubCategoryName,
            C.Description,
            COUNT(DISTINCT BC.BookID) AS BookCount
        FROM Category C
        LEFT JOIN BookCategory BC ON C.CategoryID = BC.CategoryID
        WHERE C.SubcategoryID = %s
        GROUP BY C.CategoryID, C.Name, C.Description
        ORDER BY C.Name ASC
    """
    rows = query_all(sql, (category_id,))
    return jsonify(rows), 200

@category_bp.get("/<int:category_id>/details")
def get_category_details(category_id):
    """Get detailed information about a category including parent info and subcategories."""
    print(f"[get_category_details] Fetching details for category {category_id}")
    
    sql = """
        SELECT 
            C.CategoryID,
            C.Name,
            C.Description,
            C.SubcategoryID,
            P.Name AS ParentCategoryName,
            COUNT(DISTINCT BC.BookID) AS BookCount
        FROM Category C
        LEFT JOIN Category P ON C.SubcategoryID = P.CategoryID
        LEFT JOIN BookCategory BC ON C.CategoryID = BC.CategoryID
        WHERE C.CategoryID = %s
        GROUP BY C.CategoryID, C.Name, C.Description, C.SubcategoryID, P.Name
    """
    
    category = query_one(sql, [category_id])
    if not category:
        return jsonify({"error": "Category not found"}), 404
    
    # Get subcategories if this is a parent category
    if category['SubcategoryID'] is None:
        sub_sql = """
            SELECT 
                C.CategoryID,
                C.Name,
                C.Description,
                COUNT(DISTINCT BC.BookID) AS BookCount
            FROM Category C
            LEFT JOIN BookCategory BC ON C.CategoryID = BC.CategoryID
            WHERE C.SubcategoryID = %s
            GROUP BY C.CategoryID, C.Name, C.Description
            ORDER BY C.Name ASC
        """
        subcategories = query_all(sub_sql, [category_id])
        category['SubCategories'] = subcategories
    
    return jsonify(category), 200

@category_bp.get("/sub-categories")
def get_all_categories_with_subs():
    """Get all parent categories with their subcategories."""
    print("[get_all_categories_with_subs] Fetching all categories with subcategories")
    
    sql = """
        SELECT 
            C.CategoryID,
            C.Name AS CategoryName,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'SubCategoryID', SC.CategoryID,
                    'Name', SC.Name
                )
            ) AS SubCategories
        FROM Category C
        LEFT JOIN Category SC ON C.CategoryID = SC.SubcategoryID
        WHERE C.SubcategoryID IS NULL
        GROUP BY C.CategoryID, C.Name
        ORDER BY C.Name ASC
    """
    
    try:
        categories = query_all(sql)
        print(f"[get_all_categories_with_subs] Retrieved {len(categories)} categories")
        return jsonify(categories), 200
    except Exception as e:
        print(f"[get_all_categories_with_subs] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500