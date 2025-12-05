Use Assignment2_Bookstore_DB;

DELIMITER //

-- Order.TotalAmount = sum of PriceAtPurchase of all OrderItem within this Order
CREATE PROCEDURE CalculateAndUpdateOrderTotal (IN p_OrderID VARCHAR(10))
BEGIN
    DECLARE v_NewTotal DECIMAL(10, 2);
    
    -- Calculate the New Total Amount
    SELECT 
        SUM(PriceAtPurchase)
    INTO 
        v_NewTotal
    FROM 
        OrderItem
    WHERE 
        OrderID = p_OrderID;
    
    -- Update the Order table
    UPDATE 
        `Order`
    SET 
        TotalAmount = IFNULL(v_NewTotal, 0.00) -- Use 0.00 if no items found
    WHERE 
        OrderID = p_OrderID;

END //

-- Calc TotalAmount again when PriceAtPurchase is change on insert/update/delete
CREATE TRIGGER trg_OrderItem_AfterInsert
AFTER INSERT ON OrderItem
FOR EACH ROW
BEGIN
    CALL CalculateAndUpdateOrderTotal(NEW.OrderID);
END //

CREATE TRIGGER trg_OrderItem_AfterUpdate
AFTER UPDATE ON OrderItem
FOR EACH ROW
BEGIN
    IF NEW.PriceAtPurchase != OLD.PriceAtPurchase THEN
        CALL CalculateAndUpdateOrderTotal(NEW.OrderID);
    END IF;
END //

CREATE TRIGGER trg_OrderItem_AfterDelete
AFTER DELETE ON OrderItem
FOR EACH ROW
BEGIN
    CALL CalculateAndUpdateOrderTotal(OLD.OrderID);
END //

-- When inserting into Payment, take TotalAmount from Order
CREATE TRIGGER trg_Payment_SetTotalAmount
BEFORE INSERT ON Payment
FOR EACH ROW
BEGIN
	DECLARE v_TotalAmount DECIMAL(10, 2);
    DECLARE v_OrderExists BOOL DEFAULT FALSE;
    
	SELECT 1 INTO v_OrderExists
	FROM OrderItem
	WHERE OrderID = NEW.OrderID
	LIMIT 1;
	
	IF v_OrderExists = 1 THEN
		SELECT TotalAmount INTO v_TotalAmount
        FROM `Order`
        WHERE OrderID = NEW.OrderID;
		
		SET NEW.TotalAmount = v_TotalAmount;
	ELSE
		SIGNAL SQLSTATE '45000'
		SET MESSAGE_TEXT = 'Cannot insert payment because order is yet to be made';
	END IF;
END //

-- When TotalAmount of an Order is updated, update it in Payment too (if there is)
CREATE TRIGGER trg_Order_AfterUpdate_UpdatePayment
AFTER UPDATE ON `Order`
FOR EACH ROW
BEGIN
    IF NEW.TotalAmount != OLD.TotalAmount THEN
        -- This ensures the audit trail reflects the adjusted order price.
        UPDATE Payment
        SET TotalAmount = NEW.TotalAmount
        WHERE OrderID = NEW.OrderID;
        -- If there's no row in Payment yet, this simple does nothing
    END IF;
END //

DELIMITER ;