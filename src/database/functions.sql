USE Assignment2_Bookstore_DB;

DROP FUNCTION IF EXISTS getTitleByFormatID;
DROP FUNCTION IF EXISTS getPriceByFormatID;
DROP FUNCTION IF EXISTS getCartIDByAccountID;
DROP PROCEDURE IF EXISTS GetReviewsForBookSorted;
DROP FUNCTION IF EXISTS GetAverageRatingForBook;
DROP PROCEDURE IF EXISTS GetTopSellingAuthors;

DELIMITER //

CREATE FUNCTION getTitleByFormatID (
	p_FormatID VARCHAR(10)
) RETURNS varchar(255)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_Title VARCHAR(255);

    -- Join Format, Edition and Book tables to find the title.
    -- We use LIMIT 1 because a function must return a single value.
    SELECT B.Title
    INTO v_Title
    FROM Format F
    JOIN Edition E ON E.EditionID = F.EditionID
    JOIN Book B ON E.BookID = B.BookID
    WHERE F.FormatID= p_FormatID
    LIMIT 1;

    -- Return the found title or NULL if no book is associated with the FormatID
    RETURN v_Title;

END //

CREATE FUNCTION getPriceByFormatID(
    p_FormatID VARCHAR(10)
) RETURNS DECIMAL(10, 2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_Price DECIMAL(10, 2);
    SELECT Price 
    INTO v_Price 
    FROM Format F 
    JOIN Edition E ON F.EditionID = E.EditionID
    WHERE F.FormatID = p_FormatID;
    RETURN v_Price;
END//

CREATE FUNCTION getCartIDByAccountID(
    p_AccountID VARCHAR(10)
) RETURNS INT
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_CartID INT;
    
    SELECT CartID
    INTO v_CartID
    FROM ShoppingCart SC
    WHERE SC.AccountID = p_AccountID
    LIMIT 1;
    
    RETURN v_CartID;
END //

CREATE PROCEDURE GetReviewsForBookSorted (
    IN p_BookID VARCHAR(10)
)
BEGIN
    SELECT
        R.Rating,
        R.Comment,
        R.ReviewDate,
        CA.Name
    FROM Review R
    JOIN OrderItem OI ON R.OrderID = OI.OrderID AND R.OrderNo = OI.OrderNo
    JOIN Format F ON OI.FormatID = F.FormatID
    JOIN Edition E ON F.EditionID = E.EditionID
    JOIN Book B ON E.BookID = B.BookID
    JOIN `Order` O ON R.OrderID = O.OrderID
    JOIN CustomerAccount CA ON O.AccountID = CA.AccountID
    WHERE B.BookID = p_BookID
    ORDER BY R.Rating DESC, 	-- Primary sort: Highest Rating first
			R.ReviewDate DESC; 	-- Secondary sort: Newest Review Date first

END //

CREATE FUNCTION GetAverageRatingForBook (
    p_BookID VARCHAR(10) -- The identifier for Book of which we want to get the average rating
) RETURNS DECIMAL(3, 2) -- The average rating
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_AverageRating DECIMAL(3, 2);

    SELECT 
        AVG(R.Rating)
    INTO 
        v_AverageRating
    FROM
        Review R
    JOIN
        OrderItem OI ON R.OrderID = OI.OrderID AND R.OrderNo = OI.OrderNo
    JOIN
        Format F ON OI.FormatID = F.FormatID
    JOIN
        Edition E ON F.EditionID = E.EditionID
    JOIN
        Book B ON E.BookID = B.BookID
    WHERE
        B.BookID = p_BookID;

    -- Return the calculated average rating, or NULL if no reviews exist
    RETURN v_AverageRating;

END //

CREATE PROCEDURE GetTopSellingAuthors (
    IN p_MinTotalQuantitySold INT -- Input parameter used in the HAVING clause
)
BEGIN
    SELECT
        A.AuthorID,
        A.Name AS AuthorName,
        SUM(OI.Quantity) AS TotalQuantitySold,   -- 1. Aggregate: Sum of sales quantity
        COUNT(DISTINCT B.BookID) AS NumberOfTitlesSold
    FROM Author A
    JOIN BookAuthor AB ON A.AuthorID = AB.AuthorID
    JOIN Book B ON AB.BookID = B.BookID
    JOIN Edition E ON B.BookID = E.BookID
    JOIN Format F ON E.EditionID = F.EditionID
    JOIN OrderItem OI ON F.FormatID = OI.FormatID
    JOIN `Order` O ON OI.OrderID = O.OrderID
    WHERE O.Status = 'confirmed'                     -- Filter for completed orders
    GROUP BY A.AuthorID, A.Name                     -- 2. Groups the results by Author
    HAVING TotalQuantitySold >= p_MinTotalQuantitySold -- 3. Filters the groups based on the aggregated sum
    ORDER BY                                      -- 4. Sorts the final result set
        TotalQuantitySold DESC,                   -- Sort by total sales quantity (highest first)
        AuthorName ASC;                           -- Secondary sort by name

END //

DELIMITER ;

