Use Assignment2_Bookstore_DB;
-- This file contains logic handling (mainly) triggers for
-- Item/Order no - Price - Stock Quantity
-- Specialization
-- Review
-- Delivery
DELIMITER //
-- -------------------------------------------------------
-- ITEM/ORDER NUMBER - PRICE - STOCK QUANTITY
-- This part is concerned with OrderItem and CartItem
-- -------------------------------------------------------

-- Function concerned with Price
-- CREATE FUNCTION getPriceByFormatID (p_FormatID VARCHAR(10))
-- RETURNS DECIMAL(10,2)
-- DETERMINISTIC
-- BEGIN
--     DECLARE v_EditionPrice DECIMAL(10,2) DEFAULT 0.00;

--     SELECT E.Price
--     INTO v_EditionPrice
--     FROM Edition E
--     JOIN Format F ON E.DitionID = F.EditionID
--     WHERE F.FormatID = p_FormatID;

--     RETURN IFNULL(v_EditionPrice, 0.00);
-- END;

-- For STOCK QUANTITY
CREATE FUNCTION CheckPrintedBookStock(
    p_FormatID VARCHAR(10),
    p_Quantity INT
)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_AvailableQuantity INT;

    -- Check if the Format ID exists in the Printed Book table
    IF EXISTS (SELECT 1 FROM PrintedBook WHERE FormatID = p_FormatID) THEN
        -- Get the available stock quantity
        SELECT AvailableQuantity INTO v_AvailableQuantity
        FROM PrintedBook
        WHERE FormatID = p_FormatID;

        -- Check if quantity is valid (>= 1) and less than available stock
        IF p_Quantity >= 1 AND p_Quantity <= v_AvailableQuantity THEN
            RETURN TRUE; -- Stock is available
        ELSE
            RETURN FALSE; -- Stock is insufficient or quantity is invalid
        END IF;
    ELSE
        -- If it's not a Printed Book (e.g., E-Book or Audio Book), stock is irrelevant (always available for purchase)
        IF p_Quantity >= 1 THEN
            RETURN TRUE;
        ELSE
            RETURN FALSE; -- Invalid quantity for non-printed book
        END IF;
    END IF;
END //


-- For CartITem: unique within each ShoppingCart
-- This makes CartItem automatically count when we insert into
-- E.g. If you insert 4 times in the same CartID -> ItemNo automatically counts from 1 -> 4
-- No need to specify ItemNo when inserting into CartItem (if you do, it is overwrited by this trigger anyway)
CREATE TRIGGER trg_CartItem_BeforeInsert
BEFORE INSERT ON CartItem
FOR EACH ROW
BEGIN
    DECLARE next_no INT;
    DECLARE v_TotalQuantity INT;

    -- Find the current max ItemNo for the same CartID
    SELECT IFNULL(MAX(ItemNo), 0) + 1
    INTO next_no
    FROM CartItem
    WHERE CartID = NEW.CartID;

    -- Assign it to the new row
    SET NEW.ItemNo = next_no;
    
    -- Check available stock quantity
    SELECT IFNULL(SUM(Quantity), 0) INTO v_TotalQuantity
		FROM CartItem
		WHERE FormatID = NEW.FormatID;
        
	SET v_TotalQuantity = v_TotalQuantity + NEW.Quantity;
        
    IF CheckPrintedBookStock(NEW.FormatID, v_TotalQuantity) = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot insert CartItem: Requested quantity is unavailable or invalid (must be >= 1).';
    END IF;
END //

-- When update Quantity of CartItem
CREATE TRIGGER trg_CartItem_BeforeUpdate
BEFORE UPDATE ON CartItem
FOR EACH ROW
BEGIN
	DECLARE v_TotalQuantity INT;
    -- Only check if the Quantity or Format ID has changed
    IF NEW.Quantity <> OLD.Quantity OR NEW.FormatID <> OLD.FormatID THEN
        -- Check stock using the stored function
        SELECT IFNULL(SUM(Quantity), 0) INTO v_TotalQuantity
		FROM CartItem
		WHERE FormatID = NEW.FormatID;
        
        SET v_TotalQuantity = v_TotalQuantity + NEW.Quantity - OLD.Quantity;
        
        IF CheckPrintedBookStock(NEW.FormatID, v_TotalQuantity) = FALSE THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot update CartItem: Requested quantity is unavailable or invalid (must be >= 1).';
        END IF;
    END IF;
END //

-- For OrderItem: unique within each Order
-- Same idea with CartItem
-- No need to specify OrderNo when inserting into OrderItem (if you do, it is overwrited by this trigger anyway)
CREATE TRIGGER trg_OrderItem_BeforeInsert
BEFORE INSERT ON OrderItem
FOR EACH ROW
BEGIN
    DECLARE next_no INT;
    DECLARE v_EditionPrice DECIMAL(10, 2);
    DECLARE v_TotalQuantity INT DEFAULT 0;
    
    SELECT IFNULL(SUM(Quantity), 0) INTO v_TotalQuantity
	FROM OrderItem
    WHERE FormatID=NEW.FormatID;
    
    SET v_TotalQuantity = v_TotalQuantity + NEW.Quantity;

	-- Check available stock quantity
    IF CheckPrintedBookStock(NEW.FormatID, v_TotalQuantity) = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot insert OrderItem: Requested quantity is unavailable or invalid (must be >= 1).';
    END IF;

    -- Find the current max ItemNo for the same CartID
    SELECT IFNULL(MAX(OrderNo), 0) + 1
    INTO next_no
    FROM OrderItem
    WHERE OrderID = NEW.OrderID;

    -- Assign it to the new row
    SET NEW.OrderNo = next_no;
    
     -- For PricePerItem
     -- Extract from Edition.Price
	SELECT E.Price
    INTO v_EditionPrice
    FROM Edition E
    JOIN Format F ON E.EditionID = F.EditionID
    WHERE F.FormatID = NEW.FormatID;

	SET NEW.PricePerItem = v_EditionPrice;
    
    -- For PriceAtPurchase (initially, not apply any discount)
    SET NEW.PriceAtPurchase = NEW.PricePerItem * NEW.Quantity;
END //

-- For Price of OrderItem
-- Trigger before updating an existing OrderItem
-- When updating Quantity -> Affect PriceAtPurchase
-- Cannot update when already apply discount
CREATE TRIGGER trg_OrderItem_BeforeUpdate
BEFORE UPDATE ON OrderItem
FOR EACH ROW
BEGIN
	DECLARE discount_exists INT DEFAULT 0;
	DECLARE v_TotalQuantity INT DEFAULT 0;
     
    -- If PricePerItem is updated in OrderItem, do not allow
    IF NEW.PricePerItem != OLD.PricePerItem THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not allowed to change PricePerItem directly';
    END IF;

    -- Check if this OrderItem has a matching row in DiscountApply
    SELECT COUNT(*) INTO discount_exists
    FROM DiscountApply
    WHERE OrderID = NEW.OrderID
      AND OrderNo = NEW.OrderNo;

    -- If no discount record exists, recalculate PriceAtPurchase
    IF discount_exists > 0 AND NEW.Quantity != OLD.Quantity THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already applied discount. If you want to update OrderItem, delete discount';
    ELSEIF  NEW.Quantity != OLD.Quantity THEN
		-- Update PriceAtPurchase
		SET NEw.PriceAtPurchase = NEW.Quantity * NEW.PricePerItem;
    END IF;
    
    -- Only check if the Quantity or Format ID has changed
    IF NEW.Quantity <> OLD.Quantity OR NEW.FormatID <> OLD.FormatID THEN
        -- Check stock using the stored function
		SELECT IFNULL(SUM(Quantity), 0) INTO v_TotalQuantity
		FROM OrderItem
		WHERE FormatID = NEW.FormatID;
        
        SET v_TotalQuantity = v_TotalQuantity + NEW.Quantity - OLD.Quantity;

		-- Check available stock quantity
		IF CheckPrintedBookStock(NEW.FormatID, v_TotalQuantity) = FALSE THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot update OrderItem: Requested quantity is unavailable or invalid (must be >= 1).';
        END IF;
        
	-- If Quantity changed for Printed Book -> CheckPrinteBookStock
    -- If Quantity changed but already apply discount -> Not allowed
    -- If Quantity changed but not apply discount yet -> Update PriceAtPurchase
    END IF;
    
    --
END //

-- If Edition.Price is updated -> OrderItem (if there is) get updated too
CREATE TRIGGER trg_Edition_AfterUpdate
AFTER UPDATE ON Edition
FOR EACH ROW
BEGIN
	-- Only update if the price actually changed
    IF OLD.Price != NEW.Price THEN
        UPDATE OrderItem OI
        JOIN Format F ON OI.FormatID = F.FormatID
        SET OI.PricePerItem = NEW.Price
        WHERE F.EditionID = NEW.EditionID;
        -- If no matching OrderItem yet, this just updates 0 rows.
    END IF;

END //

-- -------------------------------------------------------
-- SPECIALIZATION
-- With the way Primary Key is designed on triggers (AC, FMT, EDT, etc),
-- This section is redundant
-- -------------------------------------------------------
-- On update cascade on delete cascade ensures: an update to Account will be seen by its subclasses
-- When inserting into Account -> Please remember to also insert the customer or admin account
-- Type in Account is not null - ensures total participation on superclass side
-- Foreign key in customer and admin - ensures total participation on subclass side
-- If a subclass is inserted, it must match the type and ID in superclass
-- If an account is customer, then it's not in admin, and vice versa 

-- CustomerAccount
CREATE TRIGGER trg_check_specialization_customer
BEFORE INSERT ON CustomerAccount
FOR EACH ROW
BEGIN
	DECLARE accType ENUM('Customer', 'Administrator');
    
    SELECT AccountType INTO accType
    FROM Account
    WHERE AccountID = NEW.AccountID;
    -- Ensure the superclass exists
    IF accType IS NULL THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'AccountID does not exist in Account table.';
	END IF;
    -- Ensure type matches
    IF accType != 'Customer' THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'AccountType must be Customer for CustomerAccount.';
	END IF;
    
    -- Ensure no conflict with other subclasses (for disjointness)
	IF EXISTS (SELECT 1 FROM AdministratorAccount WHERE AccountID = NEW.AccountID) THEN
		SIGNAL SQLSTATE '45000' -- Error
        SET MESSAGE_TEXT = 'This AccountID already exists in AdministratorAccount.';
	END IF;

END //
-- AdministratorAccount
CREATE TRIGGER trg_check_specialization_admin
BEFORE INSERT ON AdministratorAccount
FOR EACH ROW
BEGIN
	DECLARE accType ENUM('Customer', 'Administrator');
    
    SELECT AccountType INTO accType
    FROM Account
    WHERE AccountID = NEW.AccountID;
    -- Ensure Account exists
    IF accType IS NULL THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'AccountID does not exist in Account table.';
	END IF;
    -- Ensure type matches subclass
    IF accType != 'Administrator' THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'AccountType must be Administrator for AdministratorAccount.';
	END IF;

	IF EXISTS (SELECT 1 FROM CustomerAccount WHERE AccountID = NEW.AccountID) THEN
		SIGNAL SQLSTATE '45000' -- Error
        SET MESSAGE_TEXT = 'This AccountID already exists in CustomerAccount.';
	END IF;
END //

-- Format
-- Well, auto-insert is not that necessary, we should manually insert 
-- (because each subclass has its own NOT NULL attrubutes

-- Printed
CREATE TRIGGER trg_check_specialization_printedbook
BEFORE INSERT ON PrintedBook
FOR EACH ROW
BEGIN
	DECLARE fmtType ENUM('Printed', 'Audio', 'E');
    
    SELECT FormatType INTO fmtType
    FROM Format
    WHERE FormatID = NEW.FormatID;
    -- Ensure the superclass exists
    IF fmtType IS NULL THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'FormatID does not exist in Format table.';
	END IF;
    -- Ensure type matches
    IF fmtType != 'Printed' THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'FormatType must be Printed for PrintedBook.';
	END IF;
    
    -- Ensure no conflict with other subclasses (for disjointness)
	IF EXISTS (SELECT 1 FROM AudioBook WHERE FormatID = NEW.FormatID) 
		OR EXISTS (SELECT 1 FROM EBook WHERE FormatID = NEW.FormatID) THEN
		SIGNAL SQLSTATE '45000' -- Error
        SET MESSAGE_TEXT = 'This FormatID already exists in other subclasses.';
	END IF;

END //
-- Audio
CREATE TRIGGER trg_check_specialization_audiobook
BEFORE INSERT ON AudioBook
FOR EACH ROW
BEGIN
	DECLARE fmtType ENUM('Printed', 'Audio', 'E');
    
    SELECT FormatType INTO fmtType
    FROM Format
    WHERE FormatID = NEW.FormatID;
    -- Ensure the superclass exists
    IF fmtType IS NULL THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'FormatID does not exist in Format table.';
	END IF;
    -- Ensure type matches
    IF fmtType != 'Audio' THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'FormatType must be Audio for AudioBook.';
	END IF;
    
    -- Ensure no conflict with other subclasses (for disjointness)
	IF EXISTS (SELECT 1 FROM PrintedBook WHERE FormatID = NEW.FormatID) 
		OR EXISTS (SELECT 1 FROM EBook WHERE FormatID = NEW.FormatID) THEN
		SIGNAL SQLSTATE '45000' -- Error
        SET MESSAGE_TEXT = 'This FormatID already exists in other subclasses.';
	END IF;

END //
-- E
CREATE TRIGGER trg_check_specialization_ebook
BEFORE INSERT ON EBook
FOR EACH ROW
BEGIN
	DECLARE fmtType ENUM('Printed', 'Audio', 'E');
    
    SELECT FormatType INTO fmtType
    FROM fmtType
    WHERE FormatID = NEW.FormatID;
    -- Ensure the superclass exists
    IF fmtType IS NULL THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'FormatID does not exist in Format table.';
	END IF;
    -- Ensure type matches
    IF fmtType != 'E' THEN
		SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'FormatType must be EBook for EBook.';
	END IF;
    
    -- Ensure no conflict with other subclasses (for disjointness)
	IF EXISTS (SELECT 1 FROM PrintedBook WHERE FormatID = NEW.FormatID) 
		OR EXISTS (SELECT 1 FROM AudioBook WHERE FormatID = NEW.FormatID) THEN
		SIGNAL SQLSTATE '45000' -- Error
        SET MESSAGE_TEXT = 'This FormatID already exists in other subclasses.';
	END IF;

END //

-- -------------------------------------------------------
-- DISCOUNT LOGIC -> discount-logic.sql
-- -------------------------------------------------------

-- -------------------------------------------------------
-- DERIVED ATTRIBUTE 
-- -------------------------------------------------------
-- TotalAmount of Order and TotalAmount of Payment -> total-amount.sql

-- -------------------------------------------------------
-- REVIEW LOGIC
-- -------------------------------------------------------
-- Not Testing yet
CREATE TRIGGER trg_Review_BeforeInsert
BEFORE INSERT ON Review
FOR EACH ROW
BEGIN
	DECLARE v_PaymentCompleted BOOL;
    DECLARE v_OrderDate DATETIME;
    
    SELECT EXISTS (
    SELECT 1
    FROM Payment
    WHERE OrderID = NEW.OrderID
      AND Status = 'completed'
	) INTO v_PaymentCompleted;
    
    SELECT OrderDate INTO v_OrderDate
    FROM `Order`
    WHERE OrderID = NEW.OrderID;
    
    IF v_PaymentCompleted = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Review insertion failed: Payment.Status must be ''complete'' before a review can be submitted.';
    END IF;
    
    IF v_OrderDate >= NEW.ReviewDate THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Review insertion failed: Review Date must be after the Order Date.';
    END IF;
    
END //
	
-- -----------------------------------------------
-- SUBCATEGORY
-- -----------------------------------------------

CREATE TRIGGER trg_Category_BeforeInsert
BEFORE INSERT ON Category
FOR EACH ROW
BEGIN
	IF NEW.SubCategoryID = NEW.CategoryID THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SubCategoryID cannot references its own ID.';
    END IF;
END //

CREATE TRIGGER trg_Category_BeforeUpdate
BEFORE UPDATE ON Category
FOR EACH ROW
BEGIN
	IF NEW.SubCategoryID = NEW.CategoryID THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SubCategoryID cannot references its own ID.';
    END IF;
END //
DELIMITER ;

