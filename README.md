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
- **Note:** If you click a category with subcategories, you have to click more onto one of the subcategory to see fileter book
- View authors and top-selling authors
- View publishers
- Add items to cart
- Apply many discounts for each order item
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

### Currently Not Implemented
- Viewing all customer carts for admin -> Do this just like orders-admin.html
- Creating/Editing/Deleting categories and subcategories for admin -> Just need to add more routes handling in admin_routes.py and index.html
- When creating/editing/deleting Book for admin, there's no AuthorID input -> Just need to add more input in Create/Edit/Delete Book
- Some files are still too large, too messy, hard to read

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
