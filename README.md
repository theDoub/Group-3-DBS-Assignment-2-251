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
## 🌐 2. Start Frontend <- Currently Should Do This For Testing

Open **Terminal 2**:
```bash
cd frontend
```
Run your frontend by first opening:
```
login.html
```
Opening any other html files before login will send you back to login.html anyway.

---
## 📌 3. Access the Application

After backend and frontend are running:

👉 Visit the correct web address:
```
http://127.0.0.1:5000
```

This address corresponds to your backend endpoint or UI depending on how your frontend is integrated.

Currently, if you access directly to the web address, it will simply print a json string.

---
## ✔ Notes
- Ensure backend is running **before** interacting with frontend.
- If frontend fetches API, make sure URLs match backend domain & port.
- Use two terminals to run frontend and backend independently.

