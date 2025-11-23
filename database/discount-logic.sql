USE Assignment2_Bookstore_DB;
DROP PROCEDURE IF EXISTS ApplyDiscountLogic;
DELIMITER //

CREATE PROCEDURE ApplyDiscountLogic (
    IN p_DiscountID INT,
    IN p_OrderID VARCHAR(10),
    IN p_OrderNo INT
)
BEGIN
    DECLARE v_DiscountType VARCHAR(50);
    DECLARE v_DiscountValue DECIMAL(10, 2);
    DECLARE v_MaxAppliedItem INT;
    DECLARE v_Validity DATETIME;

    DECLARE v_Quantity INT;
    DECLARE v_PricePerItem DECIMAL(10, 2);
    DECLARE v_BasePrice DECIMAL(10, 2);
    DECLARE v_NewPrice DECIMAL(10, 2);
    DECLARE v_TotalApplications INT;

    -- 1. Ngăn người dùng apply trùng cùng OrderItem
    IF EXISTS (
        SELECT 1 FROM DiscountApply
        WHERE DiscountID = p_DiscountID
          AND OrderID = p_OrderID
          AND OrderNo = p_OrderNo
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Discount already applied.';
    END IF;

    -- 2. Lấy thông tin discount
    SELECT Type, Value, MaxAppliedItem, ValidityPeriod
    INTO v_DiscountType, v_DiscountValue, v_MaxAppliedItem, v_Validity
    FROM Discount
    WHERE DiscountID = p_DiscountID;

    -- 3. Kiểm tra hạn sử dụng
    IF v_Validity IS NOT NULL AND NOW() > v_Validity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Discount expired.';
    END IF;

    -- 4. Kiểm tra số lần áp dụng tối đa TRONG CÙNG ORDER
    SELECT COUNT(*)
    INTO v_TotalApplications
    FROM DiscountApply
    WHERE DiscountID = p_DiscountID
      AND OrderID = p_OrderID;  -- CHỈ GIỚI HẠN TRONG ORDER

    IF v_MaxAppliedItem IS NOT NULL AND v_TotalApplications >= v_MaxAppliedItem THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Discount max applications reached for this order.';
    END IF;

    -- 5. Lấy thông tin OrderItem
    SELECT PricePerItem, Quantity
    INTO v_PricePerItem, v_Quantity
    FROM OrderItem
    WHERE OrderID = p_OrderID AND OrderNo = p_OrderNo;

    SET v_BasePrice = v_PricePerItem * v_Quantity;

    -- 6. Tính giá mới
    IF v_DiscountType = 'percentage' THEN
        SET v_NewPrice = v_BasePrice * (1 - v_DiscountValue / 100);
    ELSEIF v_DiscountType = 'fixed_amount' THEN
        SET v_NewPrice = GREATEST(v_BasePrice - v_DiscountValue, 0);
    ELSE
        SET v_NewPrice = v_BasePrice;
    END IF;

    -- 7. Update giá
    UPDATE OrderItem
    SET PriceAtPurchase = v_NewPrice
    WHERE OrderID = p_OrderID AND OrderNo = p_OrderNo;

END //

CREATE TRIGGER trg_Discountapply_Validation_Insert
BEFORE INSERT ON DiscountApply
FOR EACH ROW
BEGIN
    CALL ApplyDiscountLogic(
        NEW.DiscountID, 
        NEW.OrderID, 
        NEW.OrderNo
    );
END //


CREATE TRIGGER trg_Discountapply_Validation_Update
BEFORE UPDATE ON DiscountApply
FOR EACH ROW
BEGIN
	CALL ApplyDiscountLogic(
        NEW.DiscountID, 
        NEW.OrderID, 
        NEW.OrderNo
    );
END //

DELIMITER ;

-- DELETE FROM DiscountApply;
-- UPDATE OrderItem SET PriceAtPurchase = PricePerItem * Quantity;
