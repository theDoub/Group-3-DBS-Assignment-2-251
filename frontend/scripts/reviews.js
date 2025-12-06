let accountID = null;
let currentReviewRating = 0;
let confirmedOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.accountID) {
        window.location.href = 'login.html';
        return;
    }
    accountID = user.accountID;
    document.getElementById('welcomeUser').innerText = `Welcome, ${user.username}!`;
    
    loadConfirmedOrders();
    setupStarRating();
    loadUserReviews();
});

function loadConfirmedOrders() {
    fetch(`http://127.0.0.1:5000/api/orders?accountId=${accountID}`)
        .then(res => res.json())
        .then(orders => {
            // Filter only confirmed orders
            confirmedOrders = orders.filter(o => o.Status === 'confirmed');
            displayConfirmedOrders();
        })
        .catch(e => {
            console.error('Error loading orders:', e);
            Swal.fire('Error', 'Failed to load orders', 'error');
        });
}

function displayConfirmedOrders() {
    const container = document.getElementById('confirmedOrdersContainer');
    
    if (confirmedOrders.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    No confirmed orders yet. Place an order and wait for confirmation before writing reviews.
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = confirmedOrders.map(order => `
        <div class="col-12">
            <div class="card shadow-sm border-0 mb-3 order-card">
                <div class="card-header p-3" style="background: linear-gradient(125deg, var(--primary) 50%, var(--primary-gradient) 100%); color: white;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0 fw-bold"><i class="bi bi-receipt me-2"></i>Order #${order.OrderID}</h6>
                            <small class="text-white-50">${new Date(order.OrderDate).toLocaleDateString()}</small>
                        </div>
                        <span class="badge bg-light text-dark fs-6">$${parseFloat(order.TotalAmount).toFixed(2)}</span>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-3">
                        ${displayOrderItems(order.OrderID)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayOrderItems(orderId) {
    console.log("Displaying items for order ID:", orderId);
    fetch(`http://127.0.0.1:5000/api/orders/${orderId}?accountId=${accountID}`) // Get Order Details
        .then(res => res.json())
        .then(data => {
            console.log("Order items fetched:", data.items);

            const items = Array.isArray(data.items) ? data.items : [];

            const container = document.getElementById(`items-${orderId}`);
            if (container) {
                container.innerHTML = items.map(item =>{
                    const bookTitle = item.BookTitle.replace(/'/g, "\\'");
                    return `
                    <div class="col-md-6 col-lg-4">
                        <div class="item-card p-3 rounded-3 h-100" style="background-color: #f8f9fa; border-left: 3px solid var(--primary);">
                            <h6 class="fw-bold mb-2 text-truncate" title="${item.BookTitle}">
                                <i class="bi bi-book me-1"></i>${item.BookTitle}
                            </h6>
                            <small class="text-muted d-block mb-2">
                                <i class="bi bi-tag me-1"></i>${item.FormatType} | Qty: ${item.Quantity}
                            </small>
                            <small class="text-muted d-block mb-3">
                                <i class="bi bi-cash-coin me-1"></i>$${parseFloat(item.PricePerItem).toFixed(2)}
                            </small>
                            <button class="btn btn-primary btn-sm w-100" onclick="openReviewModal('${item.BookID}', '${bookTitle}', '${orderId}', ${item.OrderNo})">
                                <i class="bi bi-star-fill me-1"></i>Write Review
                            </button>
                        </div>
                    </div>
                `;
                }).join('');
            }
        })
        .catch(e => console.error('Error loading order items:', e));
    
    return `<div id="items-${orderId}" class="w-100"></div>`;
}

function openReviewModal(bookId, bookTitle, orderId, orderItemId) {
    document.getElementById('reviewBookId').value = bookId;
    document.getElementById('reviewOrderId').value = orderId;
    document.getElementById('reviewOrderItemId').value = orderItemId;
    document.getElementById('reviewBookTitle').value = bookTitle;
    // document.getElementById('reviewTitle').value = '';
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewRating').value = 0;
    document.getElementById('ratingDisplay').innerText = '0';
    currentReviewRating = 0;
    
    // Reset stars
    document.querySelectorAll('.star').forEach(star => {
        star.style.color = '#ddd';
    });
    
    new bootstrap.Modal(document.getElementById('reviewModal')).show();
}

function setupStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingContainer = document.querySelector('.rating-stars');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            currentReviewRating = this.dataset.rating;
            document.getElementById('reviewRating').value = currentReviewRating;
            document.getElementById('ratingDisplay').innerText = currentReviewRating;
            updateStarDisplay();
        });
        
        star.addEventListener('mouseover', function() {
            stars.forEach(s => {
                s.style.color = s.dataset.rating <= this.dataset.rating ? 'var(--primary)' : '#ddd';
            });
        });
    });
    
    ratingContainer.addEventListener('mouseleave', function() {
        updateStarDisplay();
    });
}

function updateStarDisplay() {
    document.querySelectorAll('.star').forEach(s => {
        s.style.color = s.dataset.rating <= currentReviewRating ? 'var(--primary)' : '#ddd';
    });
}

function submitReview() {
    const rating = document.getElementById('reviewRating').value;
    // const title = document.getElementById('reviewTitle').value.trim();
    const comment = document.getElementById('reviewComment').value.trim();
    const bookId = document.getElementById('reviewBookId').value;
    const orderId = document.getElementById('reviewOrderId').value;
    const orderItemId = document.getElementById('reviewOrderItemId').value;
    
    if (!rating || rating === '0') {
        Swal.fire('Error', 'Please select a rating (1-5 stars)', 'error');
        return;
    }
    
    if (!comment || comment.length < 10) {
        Swal.fire('Error', 'Review comment must be at least 10 characters', 'error');
        return;
    }
    
    Swal.fire({ title: 'Submitting...', didOpen: () => Swal.showLoading() });
    
    fetch('http://127.0.0.1:5000/api/orders/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            BookID: bookId,
            OrderID: orderId,
            OrderNo: orderItemId,
            Rating: parseInt(rating),
            Comment: comment,
            AccountID: accountID
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success!', 'Your review has been submitted successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
            loadConfirmedOrders();
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to submit review. Please try again.', 'error');
        });
}


function loadUserReviews() {
    fetch(`http://127.0.0.1:5000/api/orders/reviews?accountId=${accountID}`)
        .then(res => res.json())
        .then(reviews => {
            displayUserReviews(reviews);
        })
        .catch(e => {
            console.error('Error loading reviews:', e);
            Swal.fire('Error', 'Failed to load reviews', 'error');
        });
}

function displayUserReviews(reviews) {
    const container = document.getElementById('userReviewsContainer');
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    You haven't written any reviews yet. Write your first review above!
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => `
        <div class="col-md-6 col-lg-4">
            <div class="card review-card h-100 shadow-sm border-0">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h6 class="card-title fw-bold mb-1">
                                <i class="bi bi-receipt me-1"></i>Order #${review.OrderID}
                            </h6>
                            <small class="text-muted">Item #${review.OrderNo}</small>
                        </div>
                        <span class="badge bg-primary">${review.Rating} <i class="bi bi-star-fill"></i></span>
                    </div>
                    
                    <p class="card-text text-muted mb-3" style="font-size: 0.95rem;">
                        ${review.Comment}
                    </p>
                    
                    <small class="text-muted d-block">
                        <i class="bi bi-calendar3 me-1"></i>${new Date(review.ReviewDate).toLocaleDateString()}
                    </small>
                </div>
                <div class="card-footer bg-light border-top-0 p-2">
                    <button class="btn btn-sm btn-outline-danger w-100" onclick="deleteReview(${review.ReviewID}, ${review.OrderNo})">
                        <i class="bi bi-trash me-1"></i>Delete Review
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function deleteReview(reviewId, orderNo) {
    Swal.fire({
        title: 'Delete Review?',
        text: `Remove your review for order item #${orderNo}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`http://127.0.0.1:5000/api/orders/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ AccountID: accountID })
            })
                .then(r => r.json())
                .then(() => {
                    Swal.fire('Deleted!', 'Review removed successfully.', 'success');
                    loadUserReviews();
                })
                .catch(e => {
                    console.error('Error:', e);
                    Swal.fire('Error', 'Failed to delete review', 'error');
                });
        }
    });
}



function logout() {
    localStorage.removeItem("user");
    window.location.href = 'login.html';
}
