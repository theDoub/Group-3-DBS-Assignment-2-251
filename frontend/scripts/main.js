// API Base URL - thay đổi theo cấu hình backend
const API_BASE = 'http://localhost:5000/api';

// Global data
let allCategories = [];
let allAuthors = [];

// Load books on page load
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadBooks();
    loadCategories();
    loadAuthors();
});

// Load books from API
async function loadBooks(category = '') {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('booksGrid');
    
    loading.style.display = 'block';
    grid.innerHTML = '';

    try {
        let url = `${API_BASE}/books`;
        if (category) {
            url += `?category=${category}`;
        }

        const response = await fetch(url);
        const books = await response.json();

        loading.style.display = 'none';

        if (books.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #666;">No books found.</p>';
            return;
        }

        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.style.cursor = 'pointer';
            bookCard.onclick = () => {
                window.location.href = `book-detail.html?id=${book.BookID}`;
            };
            bookCard.innerHTML = `
                <div>
                    <h3>${book.Title}</h3>
                    <div class="book-category">${book.Categories || 'Chưa phân loại'}</div>
                    <p class="book-description">${book.Description || 'Không có mô tả'}</p>
                </div>
                <div class="book-price">${formatPrice(book.MinPrice)}</div>
            `;
            grid.appendChild(bookCard);
        });
    } catch (error) {
        loading.style.display = 'none';
        grid.innerHTML = '<p style="text-align: center; color: red;">Error loading data. Please check backend connection.</p>';
        console.error('Error loading books:', error);
    }
}

// Filter books by category
function filterBooks(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    loadBooks(category);
}

// Format price
function formatPrice(price) {
    if (!price) return 'Contact';
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(price);
}

// Scroll to books section
function scrollToBooks() {
    document.getElementById('books').scrollIntoView({ behavior: 'smooth' });
}

// Check if user has admin permissions
function hasAdminPermission() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    return roles.includes('Super Admin') || roles.includes('Content Manager');
}

// Check login status and update UI
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    const authSection = document.getElementById('authSection');
    const addBookBtn = document.getElementById('addBookBtn');
    
    if (isLoggedIn === 'true' && username) {
        // User is logged in - show username and logout button
        authSection.innerHTML = `
            <span class="user-info">👤 ${username}</span>
            <button class="btn-logout" onclick="handleLogout()">Logout</button>
        `;
        
        // Show add book button if user has admin permission
        if (hasAdminPermission() && addBookBtn) {
            addBookBtn.style.display = 'block';
        }
    } else {
        // User is not logged in - show login button
        authSection.innerHTML = `
            <button class="btn-login" onclick="showLogin()">Login</button>
        `;
    }
}

// Show login page
function showLogin() {
    window.location.href = 'login.html';
}

// Handle logout
async function handleLogout() {
    try {
        // Call logout API (optional)
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Logout API error:', error);
    }
    
    // Clear localStorage
    localStorage.removeItem('accountID');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    localStorage.removeItem('isLoggedIn');
    
    // Update UI
    checkLoginStatus();
    
    alert('Logged out successfully!');
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        allCategories = await response.json();
        populateCategoryDropdown();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load authors
async function loadAuthors() {
    try {
        const response = await fetch(`${API_BASE}/authors`);
        allAuthors = await response.json();
        populateAuthorDropdown();
    } catch (error) {
        console.error('Error loading authors:', error);
    }
}

// Populate category dropdown
function populateCategoryDropdown() {
    const select = document.getElementById('newCategories');
    if (!select) return;
    
    select.innerHTML = '';
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.CategoryID;
        option.textContent = cat.Name;
        select.appendChild(option);
    });
}

// Populate author dropdown
function populateAuthorDropdown() {
    const select = document.getElementById('newAuthors');
    if (!select) return;
    
    select.innerHTML = '';
    allAuthors.forEach(author => {
        const option = document.createElement('option');
        option.value = author.AuthorID;
        option.textContent = author.Name;
        select.appendChild(option);
    });
}

// Show add book modal
function showAddBookModal() {
    if (!hasAdminPermission()) {
        alert('You do not have permission to add books');
        return;
    }
    populateCategoryDropdown();
    populateAuthorDropdown();
    document.getElementById('addBookModal').style.display = 'block';
}

// Close add book modal
function closeAddBookModal() {
    document.getElementById('addBookModal').style.display = 'none';
    document.getElementById('addBookForm').reset();
}

// Add new book
async function addBook(event) {
    event.preventDefault();
    
    const title = document.getElementById('newTitle').value;
    const description = document.getElementById('newDescription').value;
    const categorySelect = document.getElementById('newCategories');
    const authorSelect = document.getElementById('newAuthors');
    const price = document.getElementById('newPrice').value;
    
    // Get selected categories
    const categories = Array.from(categorySelect.selectedOptions).map(opt => parseInt(opt.value));
    
    // Get selected authors
    const authors = Array.from(authorSelect.selectedOptions).map(opt => parseInt(opt.value));
    
    try {
        const response = await fetch(`${API_BASE}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description,
                categories: categories,
                authors: authors,
                price: parseFloat(price)
            })
        });
        
        if (response.ok) {
            alert('Book added successfully!');
            closeAddBookModal();
            loadBooks(); // Reload books list
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'Unable to add book'));
        }
    } catch (error) {
        console.error('Error adding book:', error);
        alert('Error connecting to server');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('addBookModal');
    if (event.target === addModal) {
        closeAddBookModal();
    }
}
