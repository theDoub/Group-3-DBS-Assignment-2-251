// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (!user) {
            // No user found, redirect to login
            window.location.href = "login.html";
            return;
        }

        // Display user's name
        const userNameElement = document.getElementById('userName');
        if (userNameElement && user.username) {
            userNameElement.textContent = user.username;
        }

        // Add entrance animation
        document.querySelector('.content-wrapper').style.opacity = '0';
        setTimeout(() => {
            document.querySelector('.content-wrapper').style.transition = 'opacity 1s ease';
            document.querySelector('.content-wrapper').style.opacity = '1';
        }, 100);

    } catch(e) {
        console.error("Error accessing localStorage:", e);
        window.location.href = "login.html";
    }
});

// Navigate to shop/index page
function navigateToShop() {
    // Add a smooth fade out effect before navigation
    const contentWrapper = document.querySelector('.content-wrapper');
    contentWrapper.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    contentWrapper.style.opacity = '0';
    contentWrapper.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Add keyboard shortcut (Enter key) to navigate
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        navigateToShop();
    }
});

// Prevent back button after successful login
window.history.pushState(null, null, window.location.href);
window.onpopstate = function() {
    window.history.pushState(null, null, window.location.href);
};
