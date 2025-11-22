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

/*
================================================================
-- PHẦN 1.2: CHÈN DỮ LIỆU (INSERT DATA) - BẢN TIẾNG ANH
--
-- Script này hoạt động với các triggers sử dụng bảng 'GlobalSequences'.
================================================================
*/

-- Chọn cơ sở dữ liệu để làm việc
USE Assignment2_Bookstore_DB;

/*
================================================================
-- NHÓM 1: BẢNG VỀ TÀI KHOẢN, VAI TRÒ VÀ QUYỀN (Account, Role, Permission)
================================================================
*/

-- 1. Bảng `Role` (4 dòng)
INSERT INTO Role (RoleName, Description)
VALUES
('Super Admin', 'Full access to all system features'),
('Content Manager', 'Manages products, authors, and categories'),
('Order Manager', 'Manages orders and shipping'),
('Customer', 'Default role for all registered customers');

-- 2. Bảng `Permission` (8 dòng)
INSERT INTO Permission (PermissionName, Description)
VALUES
('manage_users', 'Grants permission to CRUD users'),
('manage_products', 'Grants permission to CRUD products'),
('manage_orders', 'Grants permission to view and update orders'),
('manage_content', 'Grants permission to manage categories and authors'),
('view_dashboard', 'Grants permission to view the admin dashboard'),
('submit_review', 'Grants permission to submit product reviews'),
('manage_roles', 'Grants permission to manage roles and permissions'),
('manage_discounts', 'Grants permission to create and manage discounts');

-- 3. Bảng `RolePermission` (12 dòng)
INSERT INTO RolePermission (RoleID, PermissionID)
VALUES
-- Super Admin (ID 1) has all permissions
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
-- Content Manager (ID 2)
(2, 2), (2, 4),
-- Order Manager (ID 3)
(3, 3), (3, 5),
-- Customer (ID 4)
(4, 6);

-- 4. Bảng `Account` (6 dòng)
-- (Trigger sẽ tự động tạo AccountID dạng 'ACCxxxx')
INSERT INTO Account (Username, Email, PasswordHash, Status)
VALUES
('john.doe', 'john.doe@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active'),
('jane.smith', 'jane.smith@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active'),
('alex.wilson', 'alex.wilson@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active'),
('brian.white', 'brian.white@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'inactive'),
('super_admin', 'super.admin@bookstore.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active'),
('content_admin', 'content.admin@bookstore.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active');

-- 5. Bảng `CustomerAccount` (4 dòng)
-- (Các AccountID 'ACC0001', 'ACC0002'... giờ đã tồn tại)
INSERT INTO CustomerAccount (AccountID, Name, DeliveryAddress)
VALUES
('ACC0001', 'John Doe', '123 Main St, New York, NY 10001'),
('ACC0002', 'Jane Smith', '456 Oak Ave, Los Angeles, CA 90001'),
('ACC0003', 'Alex Wilson', '789 Pine Ln, Chicago, IL 60601'),
('ACC0004', 'Brian White', '101 Maple Dr, Houston, TX 77001');

-- 6. Bảng `AdministratorAccount` (2 dòng)
INSERT INTO AdministratorAccount (AccountID)
VALUES
('ACC0005'),
('ACC0006');

-- 7. Bảng `AdminRole` (4 dòng)
INSERT INTO AdminRole (AccountID, RoleID)
VALUES
('ACC0005', 1), -- super_admin is Super Admin (RoleID 1)
('ACC0006', 2), -- content_admin is Content Manager (RoleID 2)
('ACC0006', 3), -- content_admin is also Order Manager (RoleID 3)
('ACC0005', 4); -- super_admin also has Customer role (for testing)


/*
================================================================
-- NHÓM 2: BẢNG VỀ SẢN PHẨM (Book, Author, Publisher, Edition...)
================================================================
*/

-- 8. Bảng `Category` (6 dòng)
INSERT INTO Category (Name, Description, SubCategoryID)
VALUES
('Literature', 'Literary works from around the world', NULL),
('Science Fiction', 'Books about future worlds and technology', 1), -- Child of 'Literature'
('Business', 'Books on management, finance, and marketing', NULL),
('Self-Help', 'Books on soft skills and mindset', NULL),
('Personal Finance', 'Books on managing money', 3), -- Child of 'Business'
('Fantasy', 'Books of magic and high adventure', 1); -- Child of 'Literature'

-- 9. Bảng `Author` (4 dòng)
INSERT INTO Author (Name, Biography, Nationality)
VALUES
('George R.R. Martin', 'Author of the A Song of Ice and Fire series.', 'USA'),
('J.K. Rowling', 'Author of the Harry Potter series.', 'UK'),
('Yuval Noah Harari', 'Historian and author of Sapiens.', 'Israel'),
('Robert Kiyosaki', 'Author of "Rich Dad Poor Dad".', 'USA');

-- 10. Bảng `Publisher` (4 dòng)
INSERT INTO Publisher (Name)
VALUES
('Penguin Random House'),
('HarperCollins'),
('Simon & Schuster'),
('Hachette Book Group');

-- 11. Bảng `Contact` (4 dòng)
INSERT INTO Contact (PublisherID, Email, PhoneNumber, Address)
VALUES
(1, 'info@penguinrandomhouse.com', '1-212-782-9000', '1745 Broadway, New York, NY 10019'),
(2, 'info@harpercollins.com', '1-212-207-7000', '195 Broadway, New York, NY 10007'),
(3, 'info@simonandschuster.com', '1-212-698-7000', '1230 Avenue of the Americas, New York, NY 10020'),
(4, 'info@hachette.com', '1-212-364-1100', '1290 Avenue of the Americas, New York, NY 10104');

-- 12. Bảng `Book` (4 dòng)
-- (Trigger sẽ tự động tạo BookID dạng 'BOKxxxx')
INSERT INTO Book (Title, Description)
VALUES
('A Game of Thrones', 'The first book in A Song of Ice and Fire.'),
('Harry Potter and the Philosopher\'s Stone', 'The first book in the Harry Potter series.'),
('Sapiens: A Brief History of Humankind', 'A look at the history of humanity.'),
('Rich Dad Poor Dad', 'Book about financial literacy.');

-- 13. Bảng `BookAuthor` (4 dòng)
INSERT INTO BookAuthor (BookID, AuthorID)
VALUES
('BOK0001', 1), -- Book 1 - Author 1
('BOK0002', 2), -- Book 2 - Author 2
('BOK0003', 3), -- Book 3 - Author 3
('BOK0004', 4); -- Book 4 - Author 4

-- 14. Bảng `BookCategory` (4 dòng)
INSERT INTO BookCategory (BookID, CategoryID)
VALUES
('BOK0001', 6), -- A Game of Thrones - Fantasy
('BOK0002', 6), -- Harry Potter - Fantasy
('BOK0003', 4), -- Sapiens - Self-Help
('BOK0004', 5); -- Rich Dad Poor Dad - Personal Finance

-- 15. Bảng `Edition` (Phiên bản sách) (5 dòng)
-- (Trigger sẽ tự động tạo EditionID dạng 'EDTxxxx')
INSERT INTO Edition (BookID, PublisherID, PublicationDate, Price, Language)
VALUES
('BOK0001', 1, '2010-01-01', 15.00, 'English'), -- A Game of Thrones, Penguin
('BOK0002', 2, '2000-05-10', 18.00, 'English'), -- Harry Potter, HarperCollins
('BOK0003', 3, '2015-03-15', 25.00, 'English'), -- Sapiens, Simon & Schuster
('BOK0004', 4, '2004-11-20', 12.00, 'English'), -- Rich Dad Poor Dad, Hachette
('BOK0001', 1, '2018-01-01', 16.50, 'English'); -- A Game of Thrones (Reprint), Penguin

-- 16. Bảng `Format` (Định dạng sách) (8 dòng)
-- (Trigger sẽ tự động tạo FormatID dạng 'FMTxxxx')
INSERT INTO Format (EditionID)
VALUES
('EDT0001'), -- Printed (Game of Thrones)
('EDT0001'), -- Ebook (Game of Thrones)
('EDT0002'), -- Printed (Harry Potter)
('EDT0002'), -- Ebook (Harry Potter)
('EDT0002'), -- Audiobook (Harry Potter)
('EDT0003'), -- Printed (Sapiens)
('EDT0004'), -- Printed (Rich Dad Poor Dad)
('EDT0005'); -- Printed (Game of Thrones - Reprint)

-- 17. Bảng `PrintedBook` (5 dòng)
INSERT INTO PrintedBook (FormatID, AvailableQuantity, NumberOfPage, Weight)
VALUES
('FMT0001', 100, 694, 780), -- Game of Thrones
('FMT0003', 150, 223, 350), -- Harry Potter
('FMT0006', 200, 443, 550), -- Sapiens
('FMT0007', 300, 207, 300), -- Rich Dad Poor Dad
('FMT0008', 50, 704, 800); -- Game of Thrones (Reprint)

-- 18. Bảng `EBook` (2 dòng)
INSERT INTO EBook (FormatID, FileStandard, DRMScheme)
VALUES
('FMT0002', 'EPUB', 'Adobe DRM'), -- Game of Thrones
('FMT0004', 'MOBI', 'Amazon DRM'); -- Harry Potter

-- 19. Bảng `AudioBook` (1 dòng)
INSERT INTO AudioBook (FormatID, TotalDuration, AudioFormat)
VALUES
('FMT0005', 28800, 'MP3'); -- Harry Potter (28800 giây = 8 giờ)


/*
================================================================
-- NHÓM 3: BẢNG VỀ GIỎ HÀNG, ĐẶT HÀNG VÀ THANH TOÁN (Cart, Order)
================================================================
*/

-- 20. Bảng `ShoppingCart` (4 dòng)
INSERT INTO ShoppingCart (AccountID)
VALUES
('ACC0001'), -- Cart for John Doe
('ACC0002'), -- Cart for Jane Smith
('ACC0003'), -- Cart for Alex Wilson
('ACC0004'); -- Cart for Brian White

-- 21. Bảng `CartItem` (Đã cập nhật, thêm ItemNo)
INSERT INTO CartItem (ItemNo, CartID, FormatID, Quantity)
VALUES
(1, 1, 'FMT0001', 1), -- Item 1 cho Cart 1
(2, 1, 'FMT0003', 1), -- Item 2 cho Cart 1
(1, 2, 'FMT0006', 2), -- Item 1 cho Cart 2
(1, 3, 'FMT0007', 1); -- Item 1 cho Cart 3

-- 22. Bảng `Discount` (4 dòng)
INSERT INTO Discount (Name, Type, Value, Conditions)
VALUES
('WELCOME10', 'percentage', 10.00, 'For first-time orders'),
('FREESHIP', 'fixed_amount', 5.00, 'Free shipping for orders over $50'),
('BLACKFRIDAY', 'percentage', 50.00, '50% off, max $20'),
('B2G1', 'fixed_amount', 12.00, 'Buy 2 Get 1 Free (up to $12)');

-- 23. Bảng `Order` (Đơn hàng) (4 dòng)
-- (Trigger sẽ tự động tạo OrderID dạng 'ORDxxxxx')
INSERT INTO `Order` (AccountID, Status)
VALUES
('ACC0001', 'delivered'), -- John's first order
('ACC0002', 'confirmed'), -- Jane's first order
('ACC0001', 'processing'), -- John's second order
('ACC0003', 'cancelled'); -- Alex's first order

-- 24. Bảng `OrderItem` (Đã cập nhật, thêm OrderNo)
INSERT INTO OrderItem (OrderNo, OrderID, FormatID, Quantity, PriceAtPurchase)
VALUES
(1, 'ORD00001', 'FMT0001', 1, 15.00), -- Item 1 của Order 1
(2, 'ORD00001', 'FMT0004', 1, 9.99),  -- Item 2 của Order 1
(1, 'ORD00002', 'FMT0006', 1, 25.00), -- Item 1 của Order 2
(1, 'ORD00003', 'FMT0007', 2, 12.00), -- Item 1 của Order 3
(1, 'ORD00004', 'FMT0003', 1, 18.00); -- Item 1 của Order 4

-- 25. Bảng `Payment` (Thanh toán) (4 dòng)
INSERT INTO Payment (OrderID, TotalAmount, Method, Status, PaymentDate)
VALUES
('ORD00001', 24.99, 'Credit Card', 'completed', NOW()), -- 15.00 + 9.99
('ORD00002', 25.00, 'PayPal', 'completed', NOW()),
('ORD00003', 24.00, 'COD', 'pending', NULL), -- 2 * 12.00
('ORD00004', 18.00, 'Credit Card', 'refunded', NOW());

-- 26. Bảng `Delivery` (Vận chuyển) (ĐÃ SỬA LỖI)
INSERT INTO Delivery (OrderID, Status, Carrier, TrackingNumber, ActualShippingDate, ExpectedShippingDate)
VALUES
-- SỬA LỖI: Ngày thực tế '24' (trước) ngày dự kiến '25'
('ORD00001', 'delivered', 'FedEx', 'FX123456789', '2025-10-24', '2025-10-25'), 
('ORD00002', 'shipped', 'UPS', 'UPS987654321', '2025-11-01', '2025-11-03'),
('ORD00003', 'preparing', 'USPS', 'USPS111222333', NULL, '2025-11-05'),
('ORD00004', 'cancelled', 'N/A', NULL, NULL, NULL);

-- 27. Bảng `DiscountApply` (Đã cập nhật, thêm OrderNo và OrderID)
-- (Giả sử discount áp dụng cho Item đầu tiên của mỗi đơn hàng)
INSERT INTO DiscountApply (DiscountID, OrderNo, OrderID)
VALUES
(1, 1, 'ORD00001'), -- Discount 1 cho Item 1, Order 1
(2, 1, 'ORD00002'), -- Discount 2 cho Item 1, Order 2
(1, 1, 'ORD00003'), -- Discount 1 cho Item 1, Order 3
(3, 1, 'ORD00001'); -- Discount 3 cho Item 1, Order 1

-- 28. Bảng `Review` (Đã cập nhật, dùng Khóa ngoại 2-cột)
INSERT INTO Review (OrderNo, OrderID, Rating, Comment)
VALUES
(1, 'ORD00001', 5, 'Great book, fast delivery!'), -- Review cho Item 1, Order 1
(2, 'ORD00001', 4, 'Ebook version is clean and easy to read.'), -- Review cho Item 2, Order 1
(1, 'ORD00002', 5, 'Sapiens is mind-opening! Highly recommend!'), -- Review cho Item 1, Order 2
(1, 'ORD00001', 1, 'Demo review 2 for the same item.'); -- Review 2 cho Item 1, Order 1

-- Kiểm tra dữ liệu đã chèn
DESCRIBE Discount;
DESCRIBE OrderItem;
SELECT * FROM OrderItem;
SELECT * FROM Discount;
SHOW TABLES;
DESCRIBE Format;
DESCRIBE Edition;
DESCRIBE PrintedBook;

UPDATE OrderItem oi
JOIN Format f ON oi.FormatID = f.FormatID
JOIN Edition e ON f.EditionID = e.EditionID
SET oi.PricePerItem = e.Price
WHERE oi.PricePerItem IS NULL;
UPDATE OrderItem
SET PriceAtPurchase = PricePerItem * Quantity
WHERE PriceAtPurchase IS NULL;
SELECT OrderID, FormatID, PricePerItem, PriceAtPurchase
FROM OrderItem;
