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



## 🎯 Development Patterns for Future Modifications

### Backend Modification Pattern

If you want to **add or modify backend**, follow these steps:

1. **Create a new route file** in `backend/routes/` (e.g., `feedback_routes.py`):
   ```python
   from flask import Blueprint, request, jsonify
   from db import get_connection, query_all, query_one
   
   feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')
   
   @feedback_bp.get("")
   def get_all_feedback():
       # Logic here
       pass
   
   @feedback_bp.post("")
   def create_feedback():
       # Logic here
       pass
   ```

2. **Register the blueprint** in `backend/app.py`:
   ```python
   from routes.feedback_routes import feedback_bp
   app.register_blueprint(feedback_bp)
   ```

3. **Follow the standard structure:**
   - Use `get_connection()` for database operations
   - Always use **parameterized queries** to prevent SQL injection: `cursor.execute(sql, [param1, param2])`
   - Handle errors with try/except and use `conn.rollback()` on failure
   - Return JSON responses with appropriate HTTP status codes (200, 201, 400, 404, 500)
   - Use transactions for multi-table operations: `conn.commit()` when done

4. **Common HTTP Methods:**
   - `GET` - Retrieve data
   - `POST` - Create new data
   - `PUT` - Update existing data
   - `DELETE` - Remove data

---

### Frontend Modification Pattern

If you want to **add or modify frontend**, kindly follow this structure:

#### Page Template Structure
This is an example layout:
- Navigation Bar and a "hero banner"-like thing should be uniform as the other pages
- Navigation Bar is used to... navigate
- Hero Banner is just a template for introducing the current page (e.g. Introduce what Order Details does, what home page does, etc.)
- Other template is just for reference

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/page-specific.css">
</head>
<body>
    
    <!-- 1. NAVIGATION BAR (Fixed at top) -->
    <nav class="navbar navbar-expand-lg navbar-dark sticky-top" style="background-color: var(--primary);">
        <div class="container-fluid">
            <a class="navbar-brand fw-bold" href="index.html">
                <i class="bi bi-book me-2"></i>Book4U
            </a>
            <!-- Nav items here -->
        </div>
    </nav>

    <!-- 2. HERO BANNER (Page Header with Title) -->
    <div class="hero-banner" style="background: linear-gradient(125deg, var(--primary) 50%, var(--primary-gradient) 100%);">
        <div class="container py-5">
            <div class="position-relative" style="z-index: 1;">
                <h2 class="fw-bold mb-2 text-white">
                    <i class="bi bi-icon-name me-2"></i>Page Title
                </h2>
                <p class="mb-0 text-white-50">Page description or subtitle</p>
            </div>
        </div>
    </div>

    <!-- 3. MAIN CONTENT AREA -->
    <div class="container py-5">
        <!-- Add your custom content here -->
        <div id="mainContent">
            <!-- Dynamic content will be loaded here -->
        </div>
    </div>

    <!-- 4. MODALS (At bottom before scripts) -->
    <div class="modal fade" id="customModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header" style="background: linear-gradient(125deg, var(--primary) 50%, var(--primary-gradient) 100%); color: white;">
                    <h5 class="modal-title" id="customModalTitle"></h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="customModalContent"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- 5. SCRIPTS (At bottom) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="scripts/main.js"></script>
    <script src="scripts/page-specific.js"></script>
</body>
</html>
```

#### Page JavaScript File Pattern

Create a corresponding JavaScript file for each page (e.g., `scripts/feedback.js`) 

Each JavaScript starts with checking localStorage.

#### CSS Pattern

Create page-specific CSS (e.g., `styles/feedback.css`):

```css

Modfiy color scheme in .root for a quick change. There are still some separate stylings. Can't help it.

---

### Quick Checklist for New Features (No need to strictly follow)

**Backend:**
- [ ] Create route file in `backend/routes/`
- [ ] Use parameterized queries
- [ ] Handle errors with try/except
- [ ] Return JSON responses
- [ ] Register blueprint in `app.py`

**Frontend:**
- [ ] Create HTML page with nav bar + hero banner
- [ ] Create corresponding `.js` file
- [ ] Follow CRUD function naming pattern
- [ ] Use Swal.fire() for alerts
- [ ] Create corresponding `.css` file
- [ ] Test on mobile and desktop
