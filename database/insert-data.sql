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
INSERT INTO Account (Username, Email, PasswordHash, Status, AccountType)
VALUES
('john.doe', 'john.doe@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active', 'Customer'),
('jane.smith', 'jane.smith@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active', 'Customer'),
('alex.wilson', 'alex.wilson@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active', 'Customer'),
('brian.white', 'brian.white@gmail.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'inactive', 'Customer'),
('super_admin', 'super.admin@bookstore.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active', 'Administrator'),
('content_admin', 'content.admin@bookstore.com', '$2b$12$EixR.k/1tJq9s.Y3aG1xX.Vq8uJ3iC8q/b2E/E.bT3qS.K/e.Z2K', 'active', 'Administrator');

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
INSERT INTO Format (EditionID, FormatType)
VALUES
('EDT0001', 'Printed'), -- Printed (Game of Thrones)
('EDT0001', 'E'), -- Ebook (Game of Thrones)
('EDT0002', 'Printed'), -- Printed (Harry Potter)
('EDT0002', 'E'), -- Ebook (Harry Potter)
('EDT0002', 'Audio'), -- Audiobook (Harry Potter)
('EDT0003', 'Printed'), -- Printed (Sapiens)
('EDT0004', 'Printed'), -- Printed (Rich Dad Poor Dad)
('EDT0005', 'Printed'); -- Printed (Game of Thrones - Reprint)

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
-- INSERT INTO CartItem (ItemNo, CartID, FormatID, Quantity)
-- VALUES
-- (1, 1, 'FMT0001', 1), -- Item 1 cho Cart 1
-- (2, 1, 'FMT0003', 1), -- Item 2 cho Cart 1
-- (1, 2, 'FMT0006', 2), -- Item 1 cho Cart 2
-- (1, 3, 'FMT0007', 1); -- Item 1 cho Cart 3

-- 22. Bảng `Discount` (4 dòng)
INSERT INTO Discount (Name, Type, Value, Conditions)
VALUES
('WELCOME10', 'percentage', 10.00, 'For first-time orders'),
('FREESHIP', 'fixed_amount', 5.00, 'Free shipping for orders over $50'),
('BLACKFRIDAY', 'percentage', 50.00, '50% off, max $20'),
('B2G1', 'fixed_amount', 12.00, 'Buy 2 Get 1 Free (up to $12)');

-- 23. Bảng `Order` (Đơn hàng) (4 dòng)
-- (Trigger sẽ tự động tạo OrderID dạng 'ORDxxxxx')
-- INSERT INTO `Order` (AccountID, Status)
-- VALUES
-- ('ACC0001', 'delivered'), -- John's first order
-- ('ACC0002', 'confirmed'), -- Jane's first order
-- ('ACC0001', 'processing'), -- John's second order
-- ('ACC0003', 'cancelled'); -- Alex's first order

-- 24. Bảng `OrderItem` (Đã cập nhật, thêm OrderNo)
-- INSERT INTO OrderItem (OrderNo, OrderID, FormatID, Quantity, PriceAtPurchase)
-- VALUES
-- (1, 'ORD00001', 'FMT0001', 1, 15.00), -- Item 1 của Order 1
-- (2, 'ORD00001', 'FMT0004', 1, 9.99),  -- Item 2 của Order 1
-- (1, 'ORD00002', 'FMT0006', 1, 25.00), -- Item 1 của Order 2
-- (1, 'ORD00003', 'FMT0007', 2, 12.00), -- Item 1 của Order 3
-- (1, 'ORD00004', 'FMT0003', 1, 18.00); -- Item 1 của Order 4

-- 25. Bảng `Payment` (Thanh toán) (4 dòng)
-- INSERT INTO Payment (OrderID, TotalAmount, Method, Status, PaymentDate)
-- VALUES
-- ('ORD00001', 24.99, 'Credit Card', 'completed', NOW()), -- 15.00 + 9.99
-- ('ORD00002', 25.00, 'PayPal', 'completed', NOW()),
-- ('ORD00003', 24.00, 'COD', 'pending', NULL), -- 2 * 12.00
-- ('ORD00004', 18.00, 'Credit Card', 'refunded', NOW());

-- 26. Bảng `Delivery` (Vận chuyển) (ĐÃ SỬA LỖI)
-- INSERT INTO Delivery (OrderID, Status, Carrier, TrackingNumber, ActualShippingDate, ExpectedShippingDate)
-- VALUES
-- -- SỬA LỖI: Ngày thực tế '24' (trước) ngày dự kiến '25'
-- ('ORD00001', 'delivered', 'FedEx', 'FX123456789', '2025-10-24', '2025-10-25'), 
-- ('ORD00002', 'shipped', 'UPS', 'UPS987654321', '2025-11-01', '2025-11-03'),
-- ('ORD00003', 'preparing', 'USPS', 'USPS111222333', NULL, '2025-11-05'),
-- ('ORD00004', 'cancelled', 'N/A', NULL, NULL, NULL);

-- -- 27. Bảng `DiscountApply` (Đã cập nhật, thêm OrderNo và OrderID)
-- -- (Giả sử discount áp dụng cho Item đầu tiên của mỗi đơn hàng)
-- INSERT INTO DiscountApply (DiscountID, OrderNo, OrderID)
-- VALUES
-- (1, 1, 'ORD00001'), -- Discount 1 cho Item 1, Order 1
-- (2, 1, 'ORD00002'), -- Discount 2 cho Item 1, Order 2
-- (1, 1, 'ORD00003'), -- Discount 1 cho Item 1, Order 3
-- (3, 1, 'ORD00001'); -- Discount 3 cho Item 1, Order 1

-- 28. Bảng `Review` (Đã cập nhật, dùng Khóa ngoại 2-cột)
-- INSERT INTO Review (OrderNo, OrderID, Rating, Comment)
-- VALUES
-- (1, 'ORD00001', 5, 'Great book, fast delivery!'), -- Review cho Item 1, Order 1
-- (2, 'ORD00001', 4, 'Ebook version is clean and easy to read.'), -- Review cho Item 2, Order 1
-- (1, 'ORD00002', 5, 'Sapiens is mind-opening! Highly recommend!'), -- Review cho Item 1, Order 2
-- (1, 'ORD00001', 1, 'Demo review 2 for the same item.'); -- Review 2 cho Item 1, Order 1

-- Kiểm tra dữ liệu đã chèn
DESCRIBE Discount;
DESCRIBE OrderItem;
SELECT * FROM OrderItem;
SELECT * FROM Discount;
SHOW TABLES;
DESCRIBE Format;
DESCRIBE Edition;
DESCRIBE PrintedBook;

-- UPDATE OrderItem oi
-- JOIN Format f ON oi.FormatID = f.FormatID
-- JOIN Edition e ON f.EditionID = e.EditionID
-- SET oi.PricePerItem = e.Price
-- WHERE oi.PricePerItem IS NULL;
-- UPDATE OrderItem
-- SET PriceAtPurchase = PricePerItem * Quantity
-- WHERE PriceAtPurchase IS NULL;
-- SELECT OrderID, FormatID, PricePerItem, PriceAtPurchase
-- FROM OrderItem;
-- INSERT INTO Account(AccountID, AccountType, Username, Email, PasswordHash, Status)
-- VALUES ('ACC9999', 'Customer', 'test', 'test@gmail.com', '123456', 'active');
