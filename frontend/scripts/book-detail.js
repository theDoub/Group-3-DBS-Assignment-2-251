// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Get book ID from URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

// Current book data
let currentBook = null;
let allCategories = [];
let allAuthors = [];

// Check authentication and load book
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    
    if (!bookId) {
        alert('Book ID not found');
        window.location.href = 'index.html';
        return;
    }
    
    loadCategories();
    loadAuthors();
    loadBookDetail();
});

// Check login status
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    const authSection = document.getElementById('authSection');
    
    if (isLoggedIn === 'true' && username) {
        authSection.innerHTML = `
            <span class="user-info">👤 ${username}</span>
            <button class="btn-logout" onclick="handleLogout()">Logout</button>
        `;
    } else {
        authSection.innerHTML = `
            <button class="btn-login" onclick="window.location.href='login.html'">Login</button>
        `;
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('accountID');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// Check if user has admin permissions
function hasAdminPermission() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    return roles.includes('Super Admin') || roles.includes('Content Manager');
}

// Check if user has customer role
function hasCustomerRole() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    return roles.includes('Customer');
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        allCategories = await response.json();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load authors
async function loadAuthors() {
    try {
        const response = await fetch(`${API_BASE}/authors`);
        allAuthors = await response.json();
    } catch (error) {
        console.error('Error loading authors:', error);
    }
}

// Load book detail
async function loadBookDetail() {
    const loading = document.getElementById('loading');
    const bookDetail = document.getElementById('bookDetail');
    
    try {
        const response = await fetch(`${API_BASE}/books/${bookId}`);
        
        if (!response.ok) {
            throw new Error('Book not found');
        }
        
        const book = await response.json();
        currentBook = book;
        
        // Display book info
        document.getElementById('bookTitle').textContent = book.Title;
        document.getElementById('bookId').textContent = book.BookID;
        document.getElementById('bookAuthors').textContent = book.Authors || 'No author';
        document.getElementById('bookCategories').textContent = book.Categories || 'Uncategorized';
        document.getElementById('bookPrice').textContent = formatPrice(book.MinPrice);
        document.getElementById('bookDescription').textContent = book.Description || 'No description';
        
        // Show admin actions if user has permission
        if (hasAdminPermission()) {
            document.getElementById('adminActions').style.display = 'flex';
        }
        
        // Show add to cart button if user has Customer role
        const addToCartBtn = document.querySelector('.btn-add-cart');
        if (hasCustomerRole()) {
            addToCartBtn.style.display = 'inline-block';
        } else {
            addToCartBtn.style.display = 'none';
        }
        
        loading.style.display = 'none';
        bookDetail.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading book:', error);
        loading.textContent = 'Error loading book details';
    }
}

// Format price
function formatPrice(price) {
    if (!price) return 'Contact';
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(price);
}

// Edit book
function editBook() {
    if (!hasAdminPermission()) {
        alert('You do not have permission to edit books');
        return;
    }
    
    // Fill form with current data
    document.getElementById('editTitle').value = currentBook.Title;
    document.getElementById('editDescription').value = currentBook.Description || '';
    document.getElementById('editPrice').value = currentBook.MinPrice || '';
    
    // Populate category dropdown
    const categorySelect = document.getElementById('editCategories');
    categorySelect.innerHTML = '';
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.CategoryID;
        option.textContent = cat.Name;
        // Select if this category is already assigned
        if (currentBook.CategoryIDs && currentBook.CategoryIDs.includes(cat.CategoryID)) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    // Populate author dropdown
    const authorSelect = document.getElementById('editAuthors');
    authorSelect.innerHTML = '';
    allAuthors.forEach(author => {
        const option = document.createElement('option');
        option.value = author.AuthorID;
        option.textContent = author.Name;
        // Select if this author is already assigned
        if (currentBook.AuthorIDs && currentBook.AuthorIDs.includes(author.AuthorID)) {
            option.selected = true;
        }
        authorSelect.appendChild(option);
    });
    
    // Show modal
    document.getElementById('editModal').style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Save book
async function saveBook(event) {
    event.preventDefault();
    
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const price = document.getElementById('editPrice').value;
    const categorySelect = document.getElementById('editCategories');
    const authorSelect = document.getElementById('editAuthors');
    
    // Get selected categories
    const categories = Array.from(categorySelect.selectedOptions).map(opt => parseInt(opt.value));
    
    // Get selected authors
    const authors = Array.from(authorSelect.selectedOptions).map(opt => parseInt(opt.value));
    
    try {
        const response = await fetch(`${API_BASE}/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description,
                categories: categories,
                authors: authors,
                price: price ? parseFloat(price) : null
            })
        });
        
        if (response.ok) {
            alert('Book updated successfully!');
            closeEditModal();
            loadBookDetail(); // Reload book detail
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'Unable to update book'));
        }
    } catch (error) {
        console.error('Error updating book:', error);
        alert('Error connecting to server');
    }
}

// Delete book
async function deleteBook() {
    if (!hasAdminPermission()) {
        alert('You do not have permission to delete books');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${currentBook.Title}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/books/${bookId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Book deleted successfully!');
            window.location.href = 'index.html';
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'Unable to delete book'));
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('Error connecting to server');
    }
}

// Add to cart
async function addToCart() {
    if (!hasCustomerRole()) {
        alert('You need to login with a customer account to add to cart');
        return;
    }
    
    const accountID = localStorage.getItem('accountID');
    
    if (!accountID) {
        alert('Please login');
        window.location.href = 'login.html';
        return;
    }
    
    // Check if currentBook has FormatID
    if (!currentBook || !currentBook.FormatID) {
        alert('This book has no format available for sale');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountID,
                format_id: currentBook.FormatID,
                quantity: 1
            })
        });
        
        if (response.ok) {
            const goToCart = confirm('Added to cart!\nDo you want to view cart?');
            if (goToCart) {
                window.location.href = 'cart.html';
            }
        } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'Unable to add to cart'));
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error connecting to server');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}
