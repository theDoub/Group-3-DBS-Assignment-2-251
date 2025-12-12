# config.py

import os

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "sManager")       
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_password_here")
DB_NAME = os.getenv("DB_NAME", "Assignment2_Bookstore_DB")
