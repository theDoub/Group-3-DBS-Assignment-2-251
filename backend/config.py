# config.py

import os

# Bạn có thể set các biến môi trường này, hoặc sửa trực tiếp cho nhanh.
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "sManager")        # user theo đề bài
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_password_here")
DB_NAME = os.getenv("DB_NAME", "Assignment2_Bookstore_DB")
