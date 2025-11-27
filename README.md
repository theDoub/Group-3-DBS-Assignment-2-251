# Book4U - Online Bookstore Management System

Book4U is a full-stack web application designed for an online bookstore. This project demonstrates advanced database system concepts by implementing complex business logic (pricing, inventory checks, discount calculations) directly within the Database layer using Stored Procedures, Triggers, and Functions, coupled with a Python Flask backend and a modern Frontend interface.

## 🚀 Key Features

* **User Authentication:** Secure login for customers and administrators.
* **Product Management:**
    * Browse books with multiple formats (Printed, E-book, Audio).
    * **Format-specific Pricing:** Distinct prices displayed for each book format.
    * Real-time stock checking.
* **Shopping Cart:**
    * Add/Remove items.
    * Adjust quantities dynamically.
    * Auto-clear cart upon successful checkout.
* **Order Management:**
    * Create new orders.
    * **Order Lifecycle:** View order history and update status (Pay Now / Cancel) for pending orders.
* **Smart Voucher System:**
    * **Intelligent Recommendation:** Automatically suggests the best deal based on the order total.
    * **Condition Checking:** Validates voucher constraints (e.g., "Orders over $50").
    * **Limit Enforcement:** Prevents overuse of restricted vouchers (e.g., Black Friday deals).

## 🛠️ Tech Stack

* **Database:** MySQL (Triggers, Stored Procedures, Functions, Transactions).
* **Backend:** Python 3 (Flask, Flask-CORS, MySQL Connector).
* **Frontend:** HTML5, JavaScript (Fetch API).
* **UI Framework:** Bootstrap 5 (Responsive Design), SweetAlert2 (Interactive Popups).

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
    pip install -r ../requirements.txt
    ```
4.  Configure Database Connection:
    * Open `backend/config.py`.
    * Update `DB_PASSWORD` to match the password you set in Step 1.
5.  Start the Server:
    ```bash
    python app.py
    ```
    *The backend will run at `http://127.0.0.1:5000`.*

### Step 3: Frontend Setup
To avoid CORS issues and local file security restrictions, serve the frontend using a local web server.

1.  Open a **new terminal** (keep the backend running).
2.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
3.  Start a simple Python HTTP server:
    ```bash
    python -m http.server 8000
    ```
4.  Open your browser and visit:
    👉 **http://localhost:8000/login.html**

## 🔐 Demo Accounts

You can use the following credentials to test the system:

| Username | Password | Role | Note |
| :--- | :--- | :--- | :--- |
| **john.doe** | `john123` | Customer | Main test account |
| **jane.smith** | `jane456` | Customer | |
| **alex.wilson** | `alex789` | Customer | |

## 📂 Project Structure