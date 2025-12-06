// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    // Clear previous error
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Disable button during request
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful - save to localStorage
             localStorage.setItem("user", JSON.stringify(data));
            
            // Redirect to home page
            window.location.href = 'home.html';
        } else {
            // Show error message
            showError(data.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Error connecting to server. Please check backend.');
    } finally {
        // Re-enable button
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + message;
    errorMessage.classList.add('show');
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        console.log("Login status:", user.message);
        if (user.message === 'Login successful') {
            // User is already logged in, redirect to home
            window.location.href = 'home.html';
        }
    }
});
