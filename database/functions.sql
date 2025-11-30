USE Assignment2_Bookstore_DB;

DROP FUNCTION IF EXISTS getTitleByFormatID;
DROP FUNCTION IF EXISTS getPriceByFormatID;
DROP FUNCTION IF EXISTS getCartIDByAccountID;

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
) RETURNS DECIMAL(10, 2)
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
END//

DELIMITER ;

