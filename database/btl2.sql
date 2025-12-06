DROP USER IF EXISTS 'sManager'@'%';

CREATE USER 'sManager'@'%' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON Assignment2_Bookstore_DB.* TO 'sManager'@'%';
FLUSH PRIVILEGES;

DROP DATABASE Assignment2_Bookstore_DB;
CREATE DATABASE Assignment2_Bookstore_DB;
USE Assignment2_Bookstore_DB;
/*
-- CHANGE LOG -
-- ------------12/11/2025 - by Quynh
-- Search for "-- Added", "-- Changed" to see where has changes in particular
-- 1. Added UNSIGNED just to make extra extra sure (it is not really that necessary)
-- 2. Added/Changed some attributes to make it compatible with semantic contraints
-- 3. Added check constraints to implement a few semantic contraints
-- 4. Correct the Primary Key of Multivalued Attribute
-- -------------
*/
/*
================================================================
-- PHẦN 1.1: TẠO BẢNG (CREATE TABLES) - PHIÊN BẢN SỬA LỖI CUỐI CÙNG
================================================================
*/
USE Assignment2_Bookstore_DB;

/* NHÓM 1: TÀI KHOẢN, VAI TRÒ, QUYỀN */

-- 1. Bảng `Account`
CREATE TABLE Account (
    AccountID VARCHAR(10) NOT NULL, -- Sẽ là 'ACC0001', do Trigger tạo
    AccountType ENUM('Customer', 'Administrator') NOT NULL, -- Added
    Username VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    `Password` VARCHAR(255),
    PasswordHash VARCHAR(255) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (AccountID), -- Khóa chính là cột này
    UNIQUE KEY (Username),
    UNIQUE KEY (Email),
    CONSTRAINT chk_Account_Status CHECK (Status IN ('active', 'inactive', 'suspended'))
);

-- 2. Bảng `Role` (Không đổi)
CREATE TABLE Role (
    RoleID INT AUTO_INCREMENT,
    RoleName VARCHAR(100) NOT NULL,
    Description TEXT,
    PRIMARY KEY (RoleID),
    UNIQUE KEY (RoleName)
);

-- 3. Bảng `Permission` (Không đổi)
CREATE TABLE Permission (
    PermissionID INT AUTO_INCREMENT,
    PermissionName VARCHAR(100) NOT NULL,
    Description TEXT,
    PRIMARY KEY (PermissionID),
    UNIQUE KEY (PermissionName)
);

-- 4. Bảng `CustomerAccount` (Không đổi, vì đã tham chiếu đến AccountID VARCHAR)
CREATE TABLE CustomerAccount (
    AccountID VARCHAR(10),
    Name VARCHAR(255) NOT NULL,
    Profile TEXT,
    DeliveryAddress TEXT,
    PRIMARY KEY (AccountID),
    FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 5. Bảng `AdministratorAccount` (Không đổi)
CREATE TABLE AdministratorAccount (
    AccountID VARCHAR(10),
    PRIMARY KEY (AccountID),
    FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 6. Bảng `AdminRole` (Không đổi)
CREATE TABLE AdminRole (
    AccountID VARCHAR(10),
    RoleID INT,
    PRIMARY KEY (AccountID, RoleID),
    FOREIGN KEY (AccountID) REFERENCES AdministratorAccount(AccountID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Bảng `RolePermission` (Không đổi)
CREATE TABLE RolePermission (
    RoleID INT,
    PermissionID INT,
    PRIMARY KEY (RoleID, PermissionID),
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (PermissionID) REFERENCES Permission(PermissionID) ON DELETE CASCADE ON UPDATE CASCADE
);

/* NHÓM 2: SẢN PHẨM */

-- 8. Bảng `Book`
CREATE TABLE Book (
    BookID VARCHAR(10) NOT NULL, -- Sẽ là 'BOK0001'
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    PRIMARY KEY (BookID)
);

-- 9. Bảng `Author` (Không đổi)
CREATE TABLE Author (
    AuthorID INT AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    Biography TEXT,
    Nationality VARCHAR(100),
    PRIMARY KEY (AuthorID)
);

-- 10. Bảng `Category` (Không đổi)
CREATE TABLE Category (
    CategoryID INT AUTO_INCREMENT,
    SubCategoryID INT,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    PRIMARY KEY (CategoryID),
    FOREIGN KEY (SubCategoryID) REFERENCES Category(CategoryID) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 11. Bảng `Publisher` (Không đổi)
CREATE TABLE Publisher (
    PublisherID INT AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    PRIMARY KEY (PublisherID),
    UNIQUE KEY (Name)
);

-- 12. Bảng `BookAuthor`
CREATE TABLE BookAuthor (
    BookID VARCHAR(10),
    AuthorID INT,
    PRIMARY KEY (BookID, AuthorID),
    FOREIGN KEY (BookID) REFERENCES Book(BookID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AuthorID) REFERENCES Author(AuthorID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 13. Bảng `BookCategory`
CREATE TABLE BookCategory (
    BookID VARCHAR(10),
    CategoryID INT,
    PRIMARY KEY (BookID, CategoryID),
    FOREIGN KEY (BookID) REFERENCES Book(BookID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 14. Bảng `Contact` (Không đổi)
CREATE TABLE Contact ( -- Multivalued Attributes
    ContactID INT AUTO_INCREMENT,
    PublisherID INT NOT NULL,
    Email VARCHAR(100),
    PhoneNumber VARCHAR(20),
    Address TEXT,
    PRIMARY KEY (ContactID, PublisherID), -- Added PublisherID to primary key, initially: "PRIMARY KEY (ContactID)"
    FOREIGN KEY (PublisherID) REFERENCES Publisher(PublisherID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 15. Bảng `Edition`
CREATE TABLE Edition (
    EditionID VARCHAR(10) NOT NULL, -- Sẽ là 'EDT0001'
    BookID VARCHAR(10) NOT NULL,
    PublisherID INT NOT NULL,
    PublicationDate DATE,
    Price DECIMAL(10, 2) NOT NULL,
    Language VARCHAR(50),
    PRIMARY KEY (EditionID),
    FOREIGN KEY (BookID) REFERENCES Book(BookID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (PublisherID) REFERENCES Publisher(PublisherID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_Price CHECK (Price >= 0)
);

-- 16. Bảng `Format`
CREATE TABLE Format (
    FormatID VARCHAR(10) NOT NULL, -- Sẽ là 'FMT0001'
    FormatType ENUM('Printed', 'Audio', 'E') NOT NULL, -- Added
    EditionID VARCHAR(10) NOT NULL,
    PRIMARY KEY (FormatID),
    FOREIGN KEY (EditionID) REFERENCES Edition(EditionID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 17. Bảng `PrintedBook`
CREATE TABLE PrintedBook (
    FormatID VARCHAR(10),
    AvailableQuantity INT UNSIGNED NOT NULL, -- Added unsigned
    Dimension VARCHAR(100),
    NumberOfPage INT UNSIGNED, -- Added unsigned
    Weight DECIMAL(7, 2),
    PRIMARY KEY (FormatID),
    FOREIGN KEY (FormatID) REFERENCES Format(FormatID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_positive_values CHECK (
        AvailableQuantity >= 0 AND
        NumberOfPage > 0 AND
        Weight > 0
    ) -- Added constraints for NumberOfPage and Weight
);

-- 18. Bảng `AudioBook`
CREATE TABLE AudioBook (
    FormatID VARCHAR(10),
    TotalDuration INT UNSIGNED, -- Added unsigned
    AudioFormat VARCHAR(20),
    PRIMARY KEY (FormatID),
    FOREIGN KEY (FormatID) REFERENCES Format(FormatID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 19. Bảng `EBook`
CREATE TABLE EBook (
    FormatID VARCHAR(10),
    DigitalAccessRights TEXT,
    DRMScheme VARCHAR(100),
    FileStandard VARCHAR(50),
    PRIMARY KEY (FormatID),
    FOREIGN KEY (FormatID) REFERENCES Format(FormatID) ON DELETE CASCADE ON UPDATE CASCADE
);

/* NHÓM 3: GIỎ HÀNG, ĐẶT HÀNG, THANH TOÁN */

-- 20. Bảng `ShoppingCart` (Không đổi)
CREATE TABLE ShoppingCart (
    CartID INT AUTO_INCREMENT,
    AccountID VARCHAR(10) NOT NULL,
    LastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (CartID),
    UNIQUE KEY (AccountID),
    FOREIGN KEY (AccountID) REFERENCES CustomerAccount(AccountID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 21. Bảng `CartItem` (Đã sửa)
CREATE TABLE CartItem (
    ItemNo INT NOT NULL, -- Số thứ tự (1, 2, 3...) cho mỗi giỏ hàng
    CartID INT NOT NULL,
    FormatID VARCHAR(10) NOT NULL,
    Quantity INT UNSIGNED NOT NULL, -- Added unsigned
    TimeAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (ItemNo, CartID), -- Khóa chính 2-cột
    
    FOREIGN KEY (CartID) REFERENCES ShoppingCart(CartID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (FormatID) REFERENCES Format(FormatID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_Cart_Quantity CHECK (Quantity > 0)
);

-- 22. Bảng `Order`
CREATE TABLE `Order` (
    OrderID VARCHAR(10) NOT NULL, -- Sẽ là 'ORD00001'
    AccountID VARCHAR(10) NOT NULL,
    TotalAmount DECIMAL(10, 2) DEFAULT 0, -- Added
    OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(50) NOT NULL DEFAULT 'pending',
    PRIMARY KEY (OrderID),
    FOREIGN KEY (AccountID) REFERENCES CustomerAccount(AccountID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_Order_Status CHECK (Status IN ('pending', 'processing', 'confirmed', 'delivered', 'cancelled')) -- Changed
);

-- 23. Bảng `OrderItem` (Đã sửa)
CREATE TABLE OrderItem (
    OrderNo INT NOT NULL, -- Số thứ tự (1, 2, 3...) cho mỗi đơn hàng
    OrderID VARCHAR(10) NOT NULL,
    FormatID VARCHAR(10) NOT NULL,
    Quantity INT UNSIGNED NOT NULL, -- Added unsigned
    PricePerItem DECIMAL(10, 2), -- Added. This is traced by route: FormatID -> EditionID -> EditionID.Price
    PriceAtPurchase DECIMAL(10, 2) NOT NULL, -- Added unsigned
    -- PricePerItem is the price for 1 quantity of the item
	-- PriceAtPurchase is the price including consideration for discount and quantity
    PRIMARY KEY (OrderNo, OrderID), -- Khóa chính 2-cột
    
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (FormatID) REFERENCES Format(FormatID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_Order_Quantity CHECK (Quantity > 0),
    CONSTRAINT chk_Order_Price CHECK (PriceAtPurchase >= 0 AND PricePerItem >= 0)
);

-- 24. Bảng `Delivery`
CREATE TABLE Delivery (
    DeliveryID INT AUTO_INCREMENT,
    OrderID VARCHAR(10) NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'preparing',
    Carrier VARCHAR(100),
    TrackingNumber VARCHAR(100),
    ActualShippingDate DATE,
    ExpectedShippingDate DATE,
    PRIMARY KEY (DeliveryID),
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY (OrderID),
    -- Added domain for Status
    CONSTRAINT chk_Delivery_Status CHECK (Status IN ('preparing', 'shipped', 'delivering', 'delivered', 'failed', 'cancelled')),
    CONSTRAINT chk_Delivery_Dates CHECK (ActualShippingDate IS NULL OR ExpectedShippingDate IS NULL OR ActualShippingDate <= ExpectedShippingDate)
);

-- 25. Bảng `Payment`
CREATE TABLE Payment (
    PaymentID INT AUTO_INCREMENT,
    OrderID VARCHAR(10) NOT NULL,
    TotalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Added: Default 0
    Method VARCHAR(50) NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'pending',
    PaymentDate DATETIME,
    PRIMARY KEY (PaymentID),
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_Payment_Status CHECK (Status IN ('pending', 'completed', 'failed', 'refunded')),
    CONSTRAINT chk_TotalAmount CHECK (TotalAmount >= 0) 
);

-- 26. Bảng `Discount` (Không đổi)
CREATE TABLE Discount (
    DiscountID INT AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Type ENUM('percentage', 'fixed_amount') DEFAULT 'fixed_amount', -- Changed data type
    Value DECIMAL(10, 2) UNSIGNED NOT NULL, -- Added unsigned
    MaxAppliedItem INT UNSIGNED, -- Added unsigned
    Conditions TEXT,
    ValidityPeriod VARCHAR(255),
    PRIMARY KEY (DiscountID),
    CONSTRAINT chk_Discount_Value_Positive CHECK (Value > 0),
    CONSTRAINT chk_Discount_Percentage CHECK ( (Type = 'percentage' AND Value <= 100) OR (Type != 'percentage') )
);

-- 27. Bảng `DiscountApply` (Đã sửa)
CREATE TABLE DiscountApply (
    DiscountID INT,
    OrderNo INT,
    OrderID VARCHAR(10),
    
    PRIMARY KEY (DiscountID, OrderNo, OrderID), -- Khóa chính 3-cột
    
    FOREIGN KEY (DiscountID) REFERENCES Discount(DiscountID) ON DELETE CASCADE ON UPDATE CASCADE,
    -- Khóa ngoại 2-cột, tham chiếu đến OrderItem
    FOREIGN KEY (OrderNo, OrderID) REFERENCES OrderItem(OrderNo, OrderID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 28. Bảng `Review` (Đã sửa lỗi cú pháp)
CREATE TABLE Review (
    ReviewID INT AUTO_INCREMENT,
    OrderNo INT NOT NULL,
    OrderID VARCHAR(10) NOT NULL,
    Rating INT NOT NULL,
    Comment TEXT,
    ReviewDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    
    PRIMARY KEY (ReviewID), 
    
    FOREIGN KEY (OrderNo, OrderID) REFERENCES OrderItem(OrderNo, OrderID)
        ON DELETE CASCADE 
        ON UPDATE CASCADE, 
        
    CONSTRAINT chk_Rating CHECK (Rating >= 1 AND Rating <= 5)
); -- (Không có dấu phẩy ở cuối)
/*
================================================================
-- TẠO BẢNG ĐẾM (SEQUENCES)
================================================================
*/
USE Assignment2_Bookstore_DB;

CREATE TABLE GlobalSequences (
    seq_name VARCHAR(50) PRIMARY KEY,
    seq_value INT NOT NULL DEFAULT 0
);

-- Khởi tạo giá trị cho các bộ đếm
INSERT INTO GlobalSequences (seq_name, seq_value) 
VALUES
    ('account', 0),
    ('book', 0),
    ('edition', 0),
    ('format', 0),
    ('order', 0);

/*
================================================================
-- TẠO TRIGGERS (PART 2) - PHIÊN BẢN SỬA LỖI CUỐI CÙNG
================================================================
*/
USE Assignment2_Bookstore_DB;

-- 1. Trigger cho Bảng `Account`
DELIMITER $$
CREATE TRIGGER trg_account_before_insert
BEFORE INSERT ON Account
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    -- Cập nhật bộ đếm và lấy giá trị mới
    UPDATE GlobalSequences SET seq_value = seq_value + 1 WHERE seq_name = 'account';
    SELECT seq_value INTO next_id FROM GlobalSequences WHERE seq_name = 'account';
    -- Gán ID mới vào hàng đang được chèn
    SET NEW.AccountID = CONCAT('ACC', LPAD(next_id, 4, '0'));
END$$
DELIMITER ;

-- 2. Trigger cho Bảng `Book`
DELIMITER $$
CREATE TRIGGER trg_book_before_insert
BEFORE INSERT ON Book
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    UPDATE GlobalSequences SET seq_value = seq_value + 1 WHERE seq_name = 'book';
    SELECT seq_value INTO next_id FROM GlobalSequences WHERE seq_name = 'book';
    SET NEW.BookID = CONCAT('BOK', LPAD(next_id, 4, '0'));
END$$
DELIMITER ;

-- 3. Trigger cho Bảng `Edition`
DELIMITER $$
CREATE TRIGGER trg_edition_before_insert
BEFORE INSERT ON Edition
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    UPDATE GlobalSequences SET seq_value = seq_value + 1 WHERE seq_name = 'edition';
    SELECT seq_value INTO next_id FROM GlobalSequences WHERE seq_name = 'edition';
    SET NEW.EditionID = CONCAT('EDT', LPAD(next_id, 4, '0'));
END$$
DELIMITER ;

-- 4. Trigger cho Bảng `Format`
DELIMITER $$
CREATE TRIGGER trg_format_before_insert
BEFORE INSERT ON Format
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    UPDATE GlobalSequences SET seq_value = seq_value + 1 WHERE seq_name = 'format';
    SELECT seq_value INTO next_id FROM GlobalSequences WHERE seq_name = 'format';
    SET NEW.FormatID = CONCAT('FMT', LPAD(next_id, 4, '0'));
END$$
DELIMITER ;

-- 5. Trigger cho Bảng `Order`
DELIMITER $$
CREATE TRIGGER trg_order_before_insert
BEFORE INSERT ON `Order`
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    UPDATE GlobalSequences SET seq_value = seq_value + 1 WHERE seq_name = 'order';
    SELECT seq_value INTO next_id FROM GlobalSequences WHERE seq_name = 'order';
    SET NEW.OrderID = CONCAT('ORD', LPAD(next_id, 5, '0'));
END$$
DELIMITER ;

