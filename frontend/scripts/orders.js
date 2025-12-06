let username = null;
let accountID = null;
let discountModalObj = null;

document.addEventListener('DOMContentLoaded', function() {
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            username = user.username;
            accountID = user.accountID;

            // Check if user is Super Admin
            if (user.roles && user.roles.includes("Super Admin")) {
                console.log("Redirecting Super Admin to orders-admin.html");
                window.location.href = "orders-admin.html";
                return;
            }
        }
    } catch(e) {
        console.error("Error accessing localStorage:", e);
    }

    if (!accountID) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("welcomeUser").innerText = `Hi, ${username}`;


    // Initialize modal after DOM is ready
    const discountModalEl = document.getElementById('discountModal');
    if (discountModalEl) {
        discountModalObj = new bootstrap.Modal(discountModalEl);
    }

    // Check for order ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paramOrderId = urlParams.get('orderId');

    if (paramOrderId) {
        showOrderDetail(paramOrderId);
    } else {
        loadOrdersList();
    }
});

// Global variables
let currentOrderId = null;
let currentOrderNo = null;
let currentItemPrice = 0;
let currentItemQty = 1;
let currentOrderTotal = 0;

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accountID');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function backToOrders() {
    // Change inner HTML of hero banner
    const heroBanner = document.querySelector('.hero-banner');
    if (heroBanner) {
        heroBanner.innerHTML = `
            <div class="position-relative" style="z-index:1;">
                <h2 class="fw-bold mb-2">
                    <i class="bi bi-list-check me-2"></i>My Orders History
                </h2>
                <p class="mb-3 hero-stats">
                    Review your past orders and manage your purchases all in one place.
                </p>
            </div>
        `;
    }
    document.getElementById("ordersListSection").style.display = 'block';
    document.getElementById("orderDetailsSection").style.display = 'none';
    window.history.pushState({}, "", "order.html");
    loadOrdersList();
}

function loadOrdersList() {
    fetch(`http://127.0.0.1:5000/api/orders?accountId=${accountID}`)
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';
        
        if(!data || data.length === 0) {
            container.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-inbox" style="font-size: 2rem; color: var(--primary-soft);"></i><br><br>You haven't placed any orders yet.</div>`;
            return;
        }
        
        data.forEach(o => {
            let badgeClass = 'status-pending';
            let badgeIcon = '<i class="bi bi-hourglass-split me-1"></i>';
            if(o.Status === 'confirmed') {
                badgeClass = 'status-confirmed';
                badgeIcon = '<i class="bi bi-check-circle me-1"></i>';
            } else if(o.Status === 'cancelled') {
                badgeClass = 'status-cancelled';
                badgeIcon = '<i class="bi bi-x-circle me-1"></i>';
            }

            container.innerHTML += `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 order-card shadow-sm border-0">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title fw-bold" style="color: var(--primary);">#${o.OrderID}</h5>
                                <span class="badge ${badgeClass} text-dark fs-6">${badgeIcon}${o.Status.toUpperCase()}</span>
                            </div>
                            <p class="card-text text-muted mb-2"><i class="bi bi-calendar3 me-2"></i>${o.OrderDate}</p>
                            <h3 class="fw-bold my-3" style="color: var(--accent);">$${o.TotalAmount}</h3>
                            <button onclick="showOrderDetail('${o.OrderID}')" class="btn btn-outline-primary w-100 fw-500">
                                View Details <i class="bi bi-chevron-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

function showOrderDetail(orderId) {

    currentOrderId = orderId;
    document.getElementById("ordersListSection").style.display = 'none';
    document.getElementById("orderDetailsSection").style.display = 'block';
    
    const heroBanner = document.querySelector('.hero-banner');
    if (heroBanner) {
        heroBanner.innerHTML = `
            <div class="position-relative" style="z-index:1;">
                <h2 class="fw-bold mb-2">
                    <i class="bi bi-receipt me-2"></i>My Order Details
                </h2>
                <p class="mb-3 hero-stats">
                    Review the details of your order and manage your purchases.
                </p>
                <button id="backToOrdersBtn"
                onclick="backToOrders()"><i class="bi bi-arrow-left me-1"></i>My Order History</button>
            </div>
        `;
    }


    document.getElementById("itemsTable").innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';

    fetch(`http://127.0.0.1:5000/api/orders/${orderId}?accountId=${accountID}`)
    .then(res => res.json())
    .then(order => {
        document.getElementById("d_orderId").innerText = order.OrderID;
        document.getElementById("d_status").innerText = order.Status.toUpperCase();
        document.getElementById("d_date").innerText = order.OrderDate;
        document.getElementById("d_total").innerText = order.TotalAmount;
        
        // Set status badge color
        const statusBadge = document.getElementById("d_status");
        if (order.Status === 'pending') {
            statusBadge.className = 'badge status-pending fs-5 px-5 py-3 rounded-pill';
            statusBadge.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>PENDING';
        } else if (order.Status === 'confirmed') {
            statusBadge.className = 'badge status-confirmed fs-5 px-5 py-3 rounded-pill';
            statusBadge.innerHTML = '<i class="bi bi-check-circle me-2"></i>CONFIRMED';
        } else if (order.Status === 'cancelled') {
            statusBadge.className = 'badge status-cancelled fs-5 px-5 py-3 rounded-pill';
            statusBadge.innerHTML = '<i class="bi bi-x-circle me-2"></i>CANCELLED';
        }
        
        const hasPrintedBooks = order.items && order.items.some(item => item.FormatType === 'Printed');
        const deliveryAddressSection = document.getElementById('deliveryAddressSection');
        
        if (hasPrintedBooks && order.DeliveryAddress) {
            document.getElementById('deliveryAddress').innerText = order.DeliveryAddress;
            deliveryAddressSection.style.display = 'block';
        } else {
            deliveryAddressSection.style.display = 'none';
        }
        
        currentOrderTotal = parseFloat(order.TotalAmount);

        const tbody = document.getElementById("itemsTable");
        tbody.innerHTML = order.items.map(item => {
            console.log("Order Item:", item);
            const hasDiscount = item.AppliedDiscounts && item.AppliedDiscounts.trim().length > 0;
            let actionBtn = '';
            console.log("Order Status:", order.Status);
            console.log("Discount Applied:", hasDiscount);
            if (order.Status === 'pending') {
                actionBtn = `
                    <div class="d-flex gap-2 flex-nowrap">
                        <button onclick="openDiscountModal(${item.OrderNo}, ${item.PricePerItem}, ${item.Quantity})" class="btn btn-sm btn-success"><i class="bi bi-ticket-perforated me-1"></i>Apply</button>
                        <button onclick="removeDiscount(${item.OrderNo}, '${item.AppliedDiscounts}')" class="btn btn-sm btn-outline-danger" ${!hasDiscount ? 'disabled' : ''}><i class="bi bi-trash me-1"></i>Remove</button>
                    </div>
                `;
            } else {
                actionBtn = `<span class="text-muted small"><i class="bi bi-lock me-1"></i>Locked</span>`;
            }

            return `
                <tr>
                    <td class="fw-bold" style="color: var(--primary);">${item.BookTitle}</td>
                    <td><span class="badge bg-light text-dark border border-primary">${item.FormatType}</span></td>
                    <td class="text-center fw-bold">${item.Quantity}</td>
                    <td class="text-muted"><s>$${item.PricePerItem}</s></td>
                    <td class="fw-bold" style="color: var(--accent);">$${item.PriceAtPurchase}</td>
                    <td>${hasDiscount ? `<span class="badge" style="background-color: var(--accent); color: white;"><i class="bi bi-tag-fill me-1"></i>${item.AppliedDiscounts}</span>` : '<small class="text-muted">-</small>'}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        }).join('');

        const actionDiv = document.getElementById("orderActions");
        if(order.Status === 'pending') {
            actionDiv.innerHTML = `
                <button onclick="updateStatus('${order.OrderID}', 'cancelled')" class="btn btn-outline-danger btn-lg px-4">
                    <i class="bi bi-x-circle me-1"></i>Cancel Order
                </button>
                <button onclick="updateStatus('${order.OrderID}', 'confirmed')" class="btn btn-success btn-lg px-4">
                    <i class="bi bi-credit-card me-1"></i>Pay Now
                </button>
            `;
        } else {
            actionDiv.innerHTML = `<div class="py-2 fw-bold" style="color: var(--dark-text);">Status: <span style="color: var(--primary);">${order.Status.toUpperCase()}</span></div>`;
        }
    });
}

function updateStatus(orderId, newStatus) {
    if (newStatus === 'confirmed') {
        Swal.fire({
            title: 'Submit Payment?',
            text: 'Your payment will be submitted for admin approval.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            confirmButtonText: 'Yes, Submit Payment'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`http://127.0.0.1:5000/api/orders/${orderId}/submit-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        accountId: accountID,
                        paymentMethod: 'credit_card'
                    })
                })
                .then(res => res.json())
                .then(r => {
                    Swal.fire({
                        icon: 'success', 
                        title: 'Payment Submitted!', 
                        text: 'Your payment is awaiting admin approval.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => showOrderDetail(orderId));
                })
                .catch(err => {
                    Swal.fire('Error', 'Failed to submit payment', 'error');
                });
            }
        });
    } else if (newStatus === 'cancelled') {
        Swal.fire({
            title: 'Cancel Order?',
            text: 'Are you sure you want to cancel this order?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Yes, Cancel Order'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`http://127.0.0.1:5000/api/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'cancelled' })
                })
                .then(res => res.json())
                .then(r => {
                    Swal.fire('Success', r.message, 'success').then(() => showOrderDetail(orderId));
                });
            }
        });
    }
}

function openDiscountModal(orderNo, pricePerItem, quantity) {
    currentOrderNo = orderNo;
    currentItemPrice = pricePerItem;
    currentItemQty = quantity;

    const listDiv = document.getElementById("discountList");
    listDiv.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>';
    
    if (discountModalObj) {
        discountModalObj.show();
    }

    fetch("http://127.0.0.1:5000/api/orders/discounts")
    .then(res => res.json())
    .then(discounts => {
        listDiv.innerHTML = '';
        
        if(!discounts || discounts.length === 0) {
            listDiv.innerHTML = '<p class="text-center text-muted">No vouchers available.</p>';
            return;
        }

        const processed = discounts.map(d => {
            let isValid = true;
            let reason = "";

            const cond = d.Conditions ? d.Conditions.toLowerCase() : "";

            if (cond.includes("over $50") && currentOrderTotal < 50) {
                isValid = false;
                reason = `Order total must be over $50 (Current: $${currentOrderTotal})`;
            }
            if (cond.includes("buy 2") && currentItemQty < 2) {
                isValid = false;
                reason = `Must buy at least 2 items (Current: ${currentItemQty})`;
            }

            let saving = 0;
            if (isValid) {
                if (d.Type === 'percentage') {
                    saving = (currentItemPrice * d.Value) / 100;
                } else {
                    saving = d.Value;
                }
                if (saving > currentItemPrice) saving = currentItemPrice;
            }

            return { ...d, isValid, reason, saving: parseFloat(saving) };
        });

        processed.sort((a, b) => {
            if (a.isValid !== b.isValid) return b.isValid - a.isValid; 
            return b.saving - a.saving;
        });

        processed.forEach((d, index) => {
            let cardClass = d.isValid ? "" : "discount-card disabled";
            let clickAction = d.isValid ? `onclick="applyDiscount(${d.DiscountID})"` : "";
            let badge = "";
            
            if (index === 0 && d.isValid) {
                badge = `<span class="badge" style="background-color: var(--accent); color: white; margin-bottom: 0.5rem;"><i class="bi bi-star-fill me-1"></i>Recommended</span>`;
            }

            let statusHtml = "";
            if (!d.isValid) {
                statusHtml = `<div class="text-danger small fw-bold"><i class="bi bi-exclamation-circle me-1"></i>${d.reason}</div>`;
            } else {
                statusHtml = `<div class="fw-bold" style="color: var(--accent);"><i class="bi bi-percent me-1"></i>Save $${d.saving.toFixed(2)}</div>`;
            }

            listDiv.innerHTML += `
                <div class="discount-card p-3 ${cardClass}" ${clickAction} style="${d.isValid ? 'cursor:pointer; border-color: var(--primary);' : 'cursor:not-allowed;'}">
                    ${badge}
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1 fw-bold ${d.isValid ? '' : 'text-muted'}" style="color: ${d.isValid ? 'var(--primary)' : 'inherit'};"><i class="bi bi-ticket-perforated me-1"></i>${d.Name}</h6>
                            <small class="text-muted d-block fst-italic">${d.Conditions || 'No conditions'}</small>
                            ${statusHtml}
                        </div>
                        <div class="text-end">
                            <span class="d-block fw-bold fs-5" style="color: ${d.isValid ? 'var(--primary)' : '#ccc'};">
                                ${d.Type === 'percentage' ? d.Value + '%' : '$' + d.Value} OFF
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

function applyDiscount(discountId) {
    fetch(`http://127.0.0.1:5000/api/orders/${currentOrderId}/apply-discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountID: discountId, orderNo: currentOrderNo, orderID: currentOrderId })
    })
    .then(res => res.json().then(body => ({ status: res.status, body })))
    .then(r => {
        if (discountModalObj) {
            discountModalObj.hide();
        }
        if (r.status === 200) {
            Swal.fire({ icon: 'success', title: 'Applied!', text: r.body.message, timer: 1000, showConfirmButton: false });
            showOrderDetail(currentOrderId);
        } else {
            Swal.fire({ icon: 'error', title: 'Oops...', text: r.body.message || r.body.error });
        }
    });
}

function removeDiscount(orderNo, discountIds) {
    // Parse all applied discounts
    const discounts = discountIds.split(',').map(d => d.trim()).filter(d => d.length > 0);
    
    if (discounts.length === 0) {
        Swal.fire('Info', 'No discounts to remove', 'info');
        return;
    }

    // If only one discount, remove it directly
    if (discounts.length === 1) {
        confirmRemoveDiscount(orderNo, discounts[0]);
        return;
    }

    // If multiple discounts, show selection dialog
    let options = '<div class="discount-select-list">';
    discounts.forEach((discount, index) => {
        options += `<div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="discountSelect" id="discount${index}" value="${discount}" ${index === 0 ? 'checked' : ''}>
            <label class="form-check-label" for="discount${index}">
                ${discount}
            </label>
        </div>`;
    });
    options += '</div>';

    Swal.fire({
        title: 'Select Discount to Remove',
        html: options,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Remove Selected'
    }).then((result) => {
        if (result.isConfirmed) {
            const selected = document.querySelector('input[name="discountSelect"]:checked').value;
            confirmRemoveDiscount(orderNo, selected);
        }
    });
}

function confirmRemoveDiscount(orderNo, discountId) {
    fetch(`http://127.0.0.1:5000/api/orders/${currentOrderId}/delete-discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountID: discountId, orderNo: orderNo, orderID: currentOrderId })
    })
    .then(res => res.json())
    .then(() => {
        Swal.fire('Removed!', 'Voucher removed.', 'success');
        showOrderDetail(currentOrderId);
    })
    .catch(err => {
        Swal.fire('Error', 'Failed to remove discount', 'error');
    });
}




// ========== REVIEW FUNCTIONS ==========
let currentReviewRating = 0;

function openReviewModal(bookId, bookTitle, orderId) {
    document.getElementById('reviewBookId').value = bookId;
    document.getElementById('reviewOrderId').value = orderId;
    document.getElementById('reviewBookTitle').value = bookTitle;
    document.getElementById('reviewTitle').value = '';
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewRating').value = 0;
    currentReviewRating = 0;
    
    // Reset stars
    document.querySelectorAll('.star').forEach(star => {
        star.style.color = '#ddd';
    });
    
    new bootstrap.Modal(document.getElementById('reviewModal')).show();
}

// Star rating click handler
document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            currentReviewRating = this.dataset.rating;
            document.getElementById('reviewRating').value = currentReviewRating;
            
            // Highlight stars up to clicked rating
            stars.forEach(s => {
                s.style.color = s.dataset.rating <= currentReviewRating ? 'var(--primary)' : '#ddd';
            });
        });
        
        // Hover effect
        star.addEventListener('mouseover', function() {
            stars.forEach(s => {
                s.style.color = s.dataset.rating <= this.dataset.rating ? 'var(--primary)' : '#ddd';
            });
        });
    });
    
    // Reset on mouse leave
    document.querySelector('.rating-stars').addEventListener('mouseleave', function() {
        stars.forEach(s => {
            s.style.color = s.dataset.rating <= currentReviewRating ? 'var(--primary)' : '#ddd';
        });
    });
});

function submitReview() {
    const rating = document.getElementById('reviewRating').value;
    const title = document.getElementById('reviewTitle').value.trim();
    const comment = document.getElementById('reviewComment').value.trim();
    const bookId = document.getElementById('reviewBookId').value;
    const orderId = document.getElementById('reviewOrderId').value;
    
    if (!rating) {
        Swal.fire('Error', 'Please select a rating', 'error');
        return;
    }
    if (!title) {
        Swal.fire('Error', 'Review title is required', 'error');
        return;
    }
    if (!comment) {
        Swal.fire('Error', 'Review comment is required', 'error');
        return;
    }
    
    fetch('http://127.0.0.1:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            BookID: bookId,
            OrderID: orderId,
            Rating: parseInt(rating),
            Title: title,
            Comment: comment,
            AccountID: accountID
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success', 'Review submitted successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
            loadOrderItems(currentOrderId, 'Confirmed');
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to submit review', 'error');
        });
}