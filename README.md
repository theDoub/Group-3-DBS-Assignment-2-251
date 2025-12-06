# Book4U - Online Bookstore Management System

Book4U is a full-stack web application designed for an online bookstore. This project demonstrates advanced database system concepts by implementing complex business logic (pricing, inventory checks, discount calculations) directly within the Database layer using Stored Procedures, Triggers, and Functions, coupled with a Python Flask backend and a modern Frontend interface.

## 🚀 Key Features

* **User Authentication:** Secure login for customers and administrators.
* **Product Management:**
    * Browse books with multiple editions and formats (Printed, E-book, Audio).
    * **Edition & Format System:** Books can have multiple editions with language variants.
    * **Format-specific Pricing:** Distinct prices displayed for each book format.
    * Real-time stock checking.
    * **Admin Controls:** Create, edit, and delete books with editions and formats.
* **Author & Publisher Management:**
    * View author profiles and top-selling authors.
    * Manage publishers with contact information.
    * **Admin Controls:** Create, edit, and delete authors and publishers.
* **Shopping Cart:**
    * Add/Remove items.
    * Adjust quantities dynamically.
    * Auto-clear cart upon successful checkout.
* **Order Management:**
    * Create new orders with automatic total calculation.
    * **Order Lifecycle:** View order history and update status (Pay Now / Cancel) for pending orders.
    * View detailed order items and applied discounts.
    * **Remove Applied Discounts:** Select and remove specific discounts from orders.
* **Smart Voucher System:**
    * **Intelligent Recommendation:** Automatically suggests the best deal based on the order total.
    * **Condition Checking:** Validates voucher constraints (e.g., "Orders over $50").
    * **Limit Enforcement:** Prevents overuse of restricted vouchers (e.g., Black Friday deals).
    * **Admin Discount Management:** Apply and remove discounts from orders.

## 🛠️ Tech Stack

* **Database:** MySQL (Triggers, Stored Procedures, Functions, Transactions).
* **Backend:** Python 3.12 (Flask, Flask-CORS, MySQL Connector).
* **Frontend:** HTML5, CSS3, JavaScript (Fetch API, Bootstrap 5).
* **UI Framework:** Bootstrap 5 (Responsive Design), SweetAlert2 (Interactive Popups).
* **Icons:** Bootstrap Icons (bi-*)

## ⚙️ Installation & Setup Guide

Follow these steps strictly to set up the project locally.

### Step 1: Database Setup
Use a MySQL client (MySQL Workbench, DBeaver, etc.) to run the SQL scripts located in the `database/` folder in the **exact order below**:

1.  `btl2.sql` (Creates Database, Tables, and User).
    * *Note:* Update the password in the line `IDENTIFIED BY 'your_password'` to your local MySQL password (e.g., `123456`).
2.  `functions.sql` (Helper functions).
3.  `total-amount.sql` (Procedure to calculate order totals).
4.  `discount-logic.sql` (Complex discount calculation logic).
5.  `trigger.sql` (Triggers for ID generation and stock validation).
6.  `insert-data.sql` (Seed data).

### Step 2: Backend Setup

* **Tl;dr:** `cd backend`, then `python app.py` → access `http://127.0.0.1:5000`

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment (Optional but recommended):
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure Database Connection:
    * Open `backend/config.py`.
    * Update `DB_PASSWORD` to match the password you set in Step 1.
    * Ensure `DB_HOST`, `DB_USER`, and `DB_NAME` match your MySQL setup.
5.  Start the Server:
    ```bash
    python app.py
    ```
    *The backend will run at `http://127.0.0.1:5000`.*

## 📖 How to Test (IMPORTANT!)

### Step 1: Login with Demo Accounts
Login using 2 accounts (preferably in 2 different windows):
- **Customer:** `john.doe` / `john123`
- **Admin:** `super_admin` / `superadmin`

See more accounts in `backend/routes/auth_routes.py`

### Step 2: Customer Features
As a **customer**, you can:
- Browse and search for books by category
- View top-selling authors
- Add items to cart
- Apply vouchers/discounts
- Checkout and place orders
- View order history and details
- Remove applied discounts from orders
- **Note:** When paying, wait for admin confirmation of the payment before the order is completed.

### Step 3: Admin Features
As an **admin**, you can:
- **Create/Edit/Delete:** Books (with editions and formats), Authors, Publishers
- **Payment Management:** View all pending payments and accept/confirm customer payments
- **Order Management:** View and manage all customer orders
- **Delivery Management:** Auto-generate deliveries for printed books and update delivery status
- **Discount Management:** Apply and remove discounts from orders

### Currently Not Implemented
- Viewing all customer carts
- Creating/Editing/Deleting categories and subcategories


## 🔐 Demo Accounts

You can use the following credentials to test the system:

| Username | Password | Role | Features |
| :--- | :--- | :--- | :--- |
| **john.doe** | `john123` | Customer | Browse, Cart, Orders, Vouchers |
| **jane.smith** | `jane456` | Customer | Browse, Cart, Orders, Vouchers |
| **alex.wilson** | `alex789` | Customer | Browse, Cart, Orders, Vouchers |
| **super_admin** | `superadmin` | Super Admin | Manage All|

## 📂 Project Structure

```
Book4U/
├── database/
│   ├── btl2.sql
│   ├── functions.sql
│   ├── total-amount.sql
│   ├── discount-logic.sql
│   ├── trigger.sql
│   └── insert-data.sql
├── backend/
│   ├── app.py (Main Flask app)
│   ├── config.py (Database config)
│   ├── db.py (Database connection)
│   ├── routes/
│   │   ├── category_routes.py (Category, SubCategory)
│   │   ├── admin_routes.py (Admin Privileges)
│   │   ├── author_routes.py (Authors, Publishers)
│   │   ├── order_routes.py (Orders, Discounts)
│   │   ├── cart_routes.py (Shopping Cart)
│   │   └── auth_routes.py (Authentication - Login/Logout)
│   └── requirements.txt
├── frontend/
│   ├── index.html (Home/Browse Books)
│   ├── authors.html (Authors Page)
│   ├── publishers.html (Publishers Page)
│   ├── cart.html (Shopping Cart)
│   ├── order.html (Order for Customer)
│   ├── orders-admin.html (Order for Admin)
│   ├── login.html (Login Page)
│   ├── styles/
│   │   ├── main.css
│   │   ├── orders.css
│   │   └── ...
│   └── scripts/
│       ├── main.js (Home/Book operations)
│       ├── authors.js (Author management)
│       ├── publishers.js (Publisher management)
│       ├── cart.js (Cart operations)
│       ├── orders.js (Order operations)
│       └── login.js (Authentication)
│       └── ...
└── README.md
```
## 🎨 UI/UX Features

* **Responsive Design:** Works seamlessly on desktop, tablet, and mobile.
* **Modal Dialogs:** Admin controls for create/edit/delete operations.
* **Alert System:** SweetAlert2 for user-friendly notifications.
* **Dynamic Tables:** Real-time updates without page reload.
* **Gradient Headers:** Modern visual design with CSS gradients.
* **Icon Integration:** Bootstrap Icons for enhanced visual communication.

## 📝 Notes

* All IDs (BookID, AuthorID, OrderID) are auto-generated via database triggers.
* Discounts are intelligently applied based on order total and conditions.
* Cart is automatically cleared after successful checkout.
* Only Super Admin role can access management features.
* Database operations use transactions for data consistency.

## ✅ Testing Checklist

- [ ] Login with customer account
- [ ] Browse books by category
- [ ] View top-selling authors
- [ ] Add items to cart
- [ ] Apply discount/voucher
- [ ] Remove discount from order
- [ ] Checkout and clear cart
- [ ] Login as admin
- [ ] Create/edit/delete book
- [ ] Create/edit/delete author
- [ ] Create/edit/delete publisher

## 📧 Support

For issues or questions, please refer to the inline code comments or check the database stored procedures documentation.