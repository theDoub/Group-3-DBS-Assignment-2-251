let user = null;
let allOrders = [];
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', function() {
    try {
        user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        // Check if user is NOT Super Admin
        if (!user.roles || !user.roles.includes("Super Admin")) {
            window.location.href = "order.html";
            return;
        }

        const welcomeUserEl = document.getElementById("welcomeUser");
        if (welcomeUserEl) {
            welcomeUserEl.innerText = `${user.username} (Admin)`;
        }

        // Load all data
        loadAllOrders();
        
        // Load payment and delivery data when modals are opened
        document.getElementById('paymentModal')?.addEventListener('show.bs.modal', loadPaymentManagement);
        document.getElementById('deliveryModal')?.addEventListener('show.bs.modal', loadDeliveryManagement);
    } catch(e) {
        console.error("Error:", e);
        window.location.href = "login.html";
    }
});

function loadAllOrders() {
    fetch("http://127.0.0.1:5000/api/admin/all")
        .then(res => res.json())
        .then(data => {
            allOrders = data || [];
            console.log("Orders loaded:", allOrders);
            displayOrders(allOrders);
        })
        .catch(err => {
            console.error('Error loading orders:', err);
            const container = document.getElementById('ordersAdminContainer');
            container.innerHTML = '<div class="col-12 text-center text-danger py-5"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load orders</div>';
        });
}

function displayOrders(orders) {
    const container = document.getElementById('ordersAdminContainer');
    container.innerHTML = '';

    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-inbox" style="font-size: 2rem;"></i><p>No orders found.</p></div>';
        return;
    }

    orders.forEach(order => {
        let badgeClass = 'status-pending';
        let badgeIcon = '<i class="bi bi-hourglass-split me-1"></i>';
        
        if (order.Status === 'confirmed') {
            badgeClass = 'status-confirmed';
            badgeIcon = '<i class="bi bi-check-circle me-1"></i>';
        } else if (order.Status === 'cancelled') {
            badgeClass = 'status-cancelled';
            badgeIcon = '<i class="bi bi-x-circle me-1"></i>';
        }

        container.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 order-admin-card shadow-sm border-0">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title fw-bold mb-1" style="color: var(--primary);">#${order.OrderID}</h5>
                                <small class="text-muted">${order.CustomerName}</small>
                                <br>
                            </div>
                            <span class="badge ${badgeClass} text-dark" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">${badgeIcon}${order.Status.toUpperCase()}</span>
                        </div>
                        <p class="card-text text-muted mb-2"><i class="bi bi-calendar3 me-2"></i>${order.OrderDate}</p>
                        <h3 class="fw-bold my-3" style="color: var(--accent);">$${parseFloat(order.TotalAmount).toFixed(2)}</h3>
                        <div class="d-grid gap-2">
                            <button onclick="showOrderDetailsModal('${order.OrderID}')" class="btn btn-outline-primary">
                                <i class="bi bi-eye me-1"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterOrdersByStatus() {
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Set new timeout to avoid excessive filtering
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchCustomer').value.toLowerCase().trim();
        const status = document.getElementById('statusFilter').value;
        
        console.log("Searching for:", searchTerm);
        console.log("All orders:", allOrders);
        
        let filtered = allOrders;

        // Filter by status
        if (status) {
            filtered = filtered.filter(o => o.Status === status);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(o => {
                const customerName = (o.CustomerName || '').toLowerCase();
                console.log("Comparing:", customerName, "with:", searchTerm);
                return customerName.includes(searchTerm);
            });
        }

        console.log("Filtered results:", filtered);
        displayOrders(filtered);
    }, 300);
}

function searchCustomers() {
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Set new timeout to avoid excessive filtering
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchCustomer').value.toLowerCase();
        const status = document.getElementById('statusFilter').value;
        
        let filtered = allOrders;

        // Filter by status
        if (status) {
            filtered = filtered.filter(o => o.Status === status);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(o => 
                (o.CustomerName && o.CustomerName.toLowerCase().includes(searchTerm))
            );
        }

        displayOrders(filtered);
    }, 300); // Wait 300ms after user stops typing
}

function showOrderDetailsModal(orderId) {
    const order = allOrders.find(o => o.OrderID === orderId);
    if (!order) {
        console.error("Order not found:", orderId);
        return;
    }

    let itemsHtml = '';
    if (order.items && order.items.length > 0) {
        itemsHtml = `
            <div class="table-responsive mb-3">
                <table class="table table-sm table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Book Title</th>
                            <th>Format</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Discount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td class="fw-bold" style="color: var(--primary);">${item.BookTitle}</td>
                                <td><span class="badge bg-light text-dark border border-primary" style="font-size: 0.75rem;">${item.FormatType}</span></td>
                                <td class="text-center">${item.Quantity}</td>
                                <td>$${parseFloat(item.PriceAtPurchase).toFixed(2)}</td>
                                <td>${item.AppliedDiscounts ? `<span class="badge" style="background-color: var(--accent); color: white; font-size: 0.75rem;">${item.AppliedDiscounts}</span>` : '<small class="text-muted">-</small>'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    const paymentInfo = order.payment ? `
        <p class="mb-1"><strong>Payment Status:</strong> <span class="badge bg-info">${order.payment.Status.toUpperCase()}</span></p>
        <p class="mb-1"><strong>Payment Method:</strong> ${order.payment.Method}</p>
    ` : '<p class="mb-1"><strong>Payment Status:</strong> <span class="badge bg-warning">Not Submitted</span></p>';

    const deliveryInfo = order.delivery ? `
        <p class="mb-1"><strong>Delivery Status:</strong> <span class="badge bg-info">${order.delivery.Status}</span></p>
        <p class="mb-1"><strong>Carrier:</strong> ${order.delivery.Carrier || 'N/A'}</p>
        <p class="mb-1"><strong>Tracking:</strong> ${order.delivery.TrackingNumber || 'N/A'}</p>
    ` : '<p class="mb-1"><strong>Delivery Status:</strong> <span class="badge bg-secondary">Not Started</span></p>';

    const detailsContent = document.getElementById('orderDetailsContent');
    detailsContent.innerHTML = `
        <div class="mb-4">
            <h6 class="fw-bold mb-3" style="color: var(--primary);"><i class="bi bi-person-circle me-2"></i>Customer Information</h6>
            <p class="mb-1"><strong>Name:</strong> ${order.CustomerName}</p>
            <p class="mb-1"><strong>Order ID:</strong> <span class="badge" style="background-color: var(--primary);">${order.OrderID}</span></p>
        </div>

        <div class="mb-4">
            <h6 class="fw-bold mb-3" style="color: var(--primary);"><i class="bi bi-bag-check me-2"></i>Order Items</h6>
            ${itemsHtml}
        </div>

        <div class="mb-4">
            <h6 class="fw-bold mb-3" style="color: var(--primary);"><i class="bi bi-credit-card me-2"></i>Payment Information</h6>
            ${paymentInfo}
        </div>

        <div class="mb-4">
            <h6 class="fw-bold mb-3" style="color: var(--primary);"><i class="bi bi-truck me-2"></i>Delivery Information</h6>
            ${deliveryInfo}
        </div>

        <div class="p-3 rounded" style="background: var(--primary-soft); border-left: 4px solid var(--primary);">
            <h6 class="fw-bold mb-3" style="color: var(--primary);"><i class="bi bi-receipt me-2"></i>Order Summary</h6>
            <p class="mb-1"><strong>Order Date:</strong> ${order.OrderDate}</p>
            <p class="mb-3"><strong>Status:</strong> <span class="badge bg-primary">${order.Status.toUpperCase()}</span></p>
            <p class="mb-0"><strong>Total Amount:</strong> <span style="color: var(--accent); font-size: 1.3rem; font-weight: bold;">$${parseFloat(order.TotalAmount).toFixed(2)}</span></p>
            ${order.DeliveryAddress ? `<p class="mt-3 mb-0"><strong>Delivery Address:</strong> ${order.DeliveryAddress}</p>` : ''}
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

// ===== PAYMENT MANAGEMENT =====
function loadPaymentManagement() {
    fetch("http://127.0.0.1:5000/api/admin/payments")
        .then(res => res.json())
        .then(payments => {
            console.log("Payments loaded:", payments);
            displayPaymentManagement(payments);
        })
        .catch(err => {
            console.error('Error loading payments:', err);
            document.getElementById('paymentManagementContent').innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load payments</div>';
        });
}

function displayPaymentManagement(payments) {
    const container = document.getElementById('paymentManagementContent');
    
    // Filter to show only pending payments
    const pendingPayments = payments.filter(p => p.Status === 'pending');
    
    if (!pendingPayments || pendingPayments.length === 0) {
        container.innerHTML = '<div class="alert alert-info"><i class="bi bi-inbox me-2"></i>No pending payments</div>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-hover"><thead class="table-light"><tr><th>Payment ID</th><th>Order ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    
    pendingPayments.forEach(payment => {
        let statusBadge = '<span class="badge bg-warning text-dark">PENDING</span>';
        let actionBtn = `<button class="btn btn-sm btn-success" onclick="approvePaymentAction(${payment.PaymentID})"><i class="bi bi-check-circle me-1"></i>Approve</button>`;
        
        html += `<tr>
            <td class="fw-bold" style="color: var(--primary);">#${payment.PaymentID}</td>
            <td>#${payment.OrderID}</td>
            <td class="fw-bold">$${parseFloat(payment.TotalAmount).toFixed(2)}</td>
            <td>${payment.Method}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function approvePaymentAction(paymentId) {
    Swal.fire({
        title: 'Approve Payment?',
        text: 'This will confirm the order and process the payment.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
    }).then(result => {
        if (result.isConfirmed) {
            approvePayment(paymentId);
        }
    });
}

function approvePayment(paymentId) {
    fetch(`http://127.0.0.1:5000/api/admin/payments/${paymentId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            adminAccountId: user.accountId
        })
    })
    .then(r => r.json())
    .then(data => {
        console.log('Payment approved:', data);
        Swal.fire('Success', 'Payment approved! Order has been confirmed.', 'success');
        loadPaymentManagement();
        loadAllOrders();  // Refresh orders list
    })
    .catch(err => {
        console.error('Error approving payment:', err);
        Swal.fire('Error', 'Failed to approve payment', 'error');
    });
}

// ===== DELIVERY MANAGEMENT =====
function loadDeliveryManagement() {
    fetch("http://127.0.0.1:5000/api/admin/deliveries")
        .then(res => res.json())
        .then(deliveries => {
            console.log("Deliveries loaded:", deliveries);
            displayDeliveryManagement(deliveries);
        })
        .catch(err => {
            console.error('Error loading deliveries:', err);
            document.getElementById('deliveryManagementContent').innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load deliveries</div>';
        });
}

function displayDeliveryManagement(deliveries) {
    const container = document.getElementById('deliveryManagementContent');
    
    if (!deliveries || deliveries.length === 0) {
        container.innerHTML = '<div class="alert alert-info"><i class="bi bi-inbox me-2"></i>No deliveries found</div>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-hover"><thead class="table-light"><tr><th>Delivery ID</th><th>Order ID</th><th>Status</th><th>Carrier</th><th>Tracking</th><th>Action</th></tr></thead><tbody>';
    
    deliveries.forEach(delivery => {
        let statusBadge = '';
        if (delivery.Status === 'pending') {
            statusBadge = '<span class="badge bg-warning text-dark">PENDING</span>';
        } else if (delivery.Status === 'delivering') {
            statusBadge = '<span class="badge bg-info">DELIVERING</span>';
        } else if (delivery.Status === 'delivered') {
            statusBadge = '<span class="badge bg-success">DELIVERED</span>';
        } else {
            statusBadge = `<span class="badge bg-secondary">${delivery.Status.toUpperCase()}</span>`;
        }
        
        html += `<tr>
            <td class="fw-bold" style="color: var(--primary);">#${delivery.DeliveryID}</td>
            <td>#${delivery.OrderID}</td>
            <td>${statusBadge}</td>
            <td>${delivery.Carrier || 'Not assigned'}</td>
            <td><code>${delivery.TrackingNumber || 'N/A'}</code></td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="updateDeliveryStatus(${delivery.DeliveryID}, '${delivery.OrderID}')"><i class="bi bi-pencil me-1"></i>Update</button></td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateDeliveryStatus(deliveryId, orderId) {
    Swal.fire({
        title: 'Update Delivery Status',
        html: `
            <div class="mb-3">
                <label class="form-label fw-bold">Status</label>
                <select class="form-select" id="deliveryStatus">
                    <option value="pending">Pending</option>
                    <option value="delivering">Delivering</option>
                    <option value="delivered">Delivered</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Carrier (optional)</label>
                <input type="text" class="form-control" id="carrier" placeholder="e.g., FedEx, UPS">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Tracking Number (optional)</label>
                <input type="text" class="form-control" id="tracking" placeholder="e.g., 1234567890">
            </div>
        `,
        confirmButtonText: 'Update',
        showCancelButton: true,
        preConfirm: () => {
            return {
                status: document.getElementById('deliveryStatus').value,
                carrier: document.getElementById('carrier').value,
                tracking: document.getElementById('tracking').value
            };
        }
    }).then(result => {
        if (result.isConfirmed) {
            updateDelivery(deliveryId, result.value);
        }
    });
}

function updateDelivery(deliveryId, data) {
    fetch(`http://127.0.0.1:5000/api/admin/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(response => {
        Swal.fire('Success', 'Delivery updated successfully', 'success');
        loadDeliveryManagement();
    })
    .catch(err => {
        console.error('Error updating delivery:', err);
        Swal.fire('Error', 'Failed to update delivery', 'error');
    });
}