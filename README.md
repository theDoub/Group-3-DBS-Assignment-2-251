# Project Setup Guide

This guide explains how to run both **backend** and **frontend** locally.

---
## 🚀 1. Start Backend Server

Open **Terminal 1**:
```bash
cd backend
python app.py
```
This will start the backend server.
Default backend URL:
```
http://127.0.0.1:5000
```

---
## 🌐 2. Start Frontend

Open **Terminal 2**:
```bash
cd frontend
```
Run your frontend by opening:
```
index.html
```
(or any other frontend file has implemented).

You can simply open the file in a browser or use a live server extension.

---
## 📌 3. Access the Application

After backend and frontend are running:

👉 Visit the correct web address:
```
http://127.0.0.1:5000
```

This address corresponds to your backend endpoint or UI depending on how your frontend is integrated.

---
## ✔ Notes
- Ensure backend is running **before** interacting with frontend.
- If frontend fetches API, make sure URLs match backend domain & port.
- Use two terminals to run frontend and backend independently.

