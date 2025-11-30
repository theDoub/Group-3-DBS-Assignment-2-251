// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Global variables
let allOrders = [];
let currentFilter = 'all';
let accountID = null;
let roles = [];
let isAdmin = false;

// Check authentication and load orders
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadOrders();
    setupFilterButtons();
});

// Check login status
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    accountID = localStorage.getItem('accountID');
    const rolesStr = localStorage.getItem('roles');
    roles = rolesStr ? JSON.parse(rolesStr) : [];
    
    const authSection = document.getElementById('authSection');
    const roleInfo = document.getElementById('roleInfo');
    
    // Check if user is admin
    isAdmin = roles.includes('Super Admin') || roles.includes('Order Manager');
    
    if (isLoggedIn === 'true' && username) {
        authSection.innerHTML = `
            <span class="user-info">👤 ${username}</span>
            <button class="btn-logout" onclick="handleLogout()">Logout</button>
        `;
        
        if (isAdmin) {
            roleInfo.textContent = 'You have permission to view all orders';
        } else {
            roleInfo.textContent = 'Your orders list';
        }
    } else {
        authSection.innerHTML = `
            <button class="btn-login" onclick="window.location.href='login.html'">Login</button>
        `;
        alert('Please login to view orders');
        window.location.href = 'login.html';
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

// Load orders from API
async function loadOrders() {
    const loading = document.getElementById('loading');
    const emptyOrders = document.getElementById('emptyOrders');
    const ordersContent = document.getElementById('ordersContent');
    
    if (!accountID) {
        loading.style.display = 'none';
        emptyOrders.style.display = 'block';
        return;
    }
    
    try {
        const rolesParam = roles.join(',');
        const response = await fetch(`${API_BASE}/orders?account_id=${accountID}&roles=${encodeURIComponent(rolesParam)}`);
        
        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        
        allOrders = await response.json();
        
        loading.style.display = 'none';
        
        if (allOrders.length === 0) {
            emptyOrders.style.display = 'block';
            ordersContent.style.display = 'none';
        } else {
            emptyOrders.style.display = 'none';
            ordersContent.style.display = 'block';
            renderOrders();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        loading.innerHTML = '<p style="color: red;">Error loading orders list</p>';
    }
}

// Setup filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.status;
            renderOrders();
        });
    });
}

// Render orders list
function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';
    
    // Filter orders
    const filteredOrders = currentFilter === 'all' 
        ? allOrders 
        : allOrders.filter(order => order.Status === currentFilter);
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <p>No orders with this status</p>
            </div>
        `;
        return;
    }
    
    filteredOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.onclick = () => viewOrderDetail(order.OrderID);
        
        const statusClass = `status-${order.Status}`;
        const statusText = getStatusText(order.Status);
        const orderDate = new Date(order.OrderDate).toLocaleString('vi-VN');
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id">Đơn hàng: ${order.OrderID}</div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            <div class="order-info">
                ${isAdmin ? `
                <div class="info-item">
                    <span class="info-label">Khách hàng</span>
                    <span class="info-value">${order.CustomerName}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Ngày đặt</span>
                    <span class="info-value">${orderDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tổng tiền</span>
                    <span class="info-value order-total">${formatPrice(order.TotalAmount)}</span>
                </div>
            </div>
            <div class="order-footer">
                <button class="btn-view-detail" onclick="event.stopPropagation(); viewOrderDetail('${order.OrderID}')">
                    Xem Chi Tiết
                </button>
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
}

// Get status text in English
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'processing': 'Processing',
        'confirmed': 'Confirmed',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

// View order detail
async function viewOrderDetail(orderId) {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderDetailContent');
    
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading details...</p></div>';
    modal.style.display = 'block';
    
    try {
        const rolesParam = roles.join(',');
        const response = await fetch(`${API_BASE}/orders/${orderId}?account_id=${accountID}&roles=${encodeURIComponent(rolesParam)}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load order details');
        }
        
        const order = await response.json();
        renderOrderDetail(order);
    } catch (error) {
        console.error('Error loading order detail:', error);
        content.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Render order detail in modal
function renderOrderDetail(order) {
    const content = document.getElementById('orderDetailContent');
    const orderDate = new Date(order.OrderDate).toLocaleString('vi-VN');
    const statusClass = `status-${order.Status}`;
    const statusText = getStatusText(order.Status);
    
    let html = `
        <!-- Order Information -->
        <div class="order-detail-section">
            <h3>Thông Tin Đơn Hàng</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Mã đơn hàng</span>
                    <span class="detail-value">${order.OrderID}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Trạng thái</span>
                    <div>
                        <span class="order-status ${statusClass}" id="currentStatus">${statusText}</span>
                        ${isAdmin ? `
                        <div class="status-change-section" style="margin-top: 1rem;">
                            <select id="statusSelect" class="status-select">
                                <option value="">-- Thay đổi trạng thái --</option>
                                <option value="pending" ${order.Status === 'pending' ? 'disabled' : ''}>Chờ xử lý</option>
                                <option value="processing" ${order.Status === 'processing' ? 'disabled' : ''}>Đang xử lý</option>
                                <option value="confirmed" ${order.Status === 'confirmed' ? 'disabled' : ''}>Đã xác nhận</option>
                                <option value="delivered" ${order.Status === 'delivered' ? 'disabled' : ''}>Đã giao</option>
                                <option value="cancelled" ${order.Status === 'cancelled' ? 'disabled' : ''}>Đã hủy</option>
                            </select>
                            <button class="btn-update-status" onclick="updateOrderStatus('${order.OrderID}')">Cập nhật</button>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ngày đặt</span>
                    <span class="detail-value">${orderDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Tổng tiền</span>
                    <span class="detail-value order-total">${formatPrice(order.TotalAmount)}</span>
                </div>
            </div>
        </div>
        
        <!-- Customer Information -->
        <div class="order-detail-section">
            <h3>Thông Tin Khách Hàng</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Tên khách hàng</span>
                    <span class="detail-value">${order.CustomerName}</span>
                </div>
                ${order.DeliveryAddress ? `
                <div class="detail-item">
                    <span class="detail-label">Địa chỉ giao hàng</span>
                    <span class="detail-value">${order.DeliveryAddress}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Delivery Information -->
        ${order.delivery ? `
        <div class="order-detail-section">
            <h3>Thông Tin Vận Chuyển</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Trạng thái vận chuyển</span>
                    <span class="detail-value">${order.delivery.Status}</span>
                </div>
                ${order.delivery.Carrier ? `
                <div class="detail-item">
                    <span class="detail-label">Đơn vị vận chuyển</span>
                    <span class="detail-value">${order.delivery.Carrier}</span>
                </div>
                ` : ''}
                ${order.delivery.TrackingNumber ? `
                <div class="detail-item">
                    <span class="detail-label">Mã vận đơn</span>
                    <span class="detail-value">${order.delivery.TrackingNumber}</span>
                </div>
                ` : ''}
                ${order.delivery.ExpectedShippingDate ? `
                <div class="detail-item">
                    <span class="detail-label">Ngày giao dự kiến</span>
                    <span class="detail-value">${new Date(order.delivery.ExpectedShippingDate).toLocaleDateString('vi-VN')}</span>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <!-- Order Items -->
        <div class="order-detail-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">Sản Phẩm</h3>
                ${isAdmin ? `
                <button class="btn-recalculate" onclick="recalculateOrderTotal('${order.OrderID}')">
                    🔄 Tính Lại Tổng Tiền
                </button>
                ` : ''}
            </div>
            <table class="order-items-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên sách</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                        ${isAdmin ? '<th>Giảm giá</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `;
    
    order.items.forEach((item, index) => {
        const discount = order.discounts.find(d => d.OrderNo === item.OrderNo);
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="item-title">${item.BookTitle}</div>
                    <div class="item-format">Format: ${item.FormatID}</div>
                    ${discount ? `
                    <div class="discount-badge">
                        🎉 Giảm giá: ${discount.Name} 
                        ${discount.Type === 'percentage' ? `${discount.Value}%` : formatPrice(discount.Value)}
                    </div>
                    ` : ''}
                </td>
                <td>${item.Quantity}</td>
                <td>${formatPrice(item.PricePerItem)}</td>
                <td><strong>${formatPrice(item.PriceAtPurchase)}</strong></td>
                ${isAdmin ? `
                <td>
                    ${!discount ? `
                    <button class="btn-apply-discount" onclick="showDiscountForm('${order.OrderID}', ${item.OrderNo})">
                        + Áp dụng
                    </button>
                    ` : '<span style="color: green;">✓ Đã áp dụng</span>'}
                </td>
                ` : ''}
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = html;
}

// Update order status (Admin only)
async function updateOrderStatus(orderId) {
    const statusSelect = document.getElementById('statusSelect');
    const newStatus = statusSelect.value;
    
    if (!newStatus) {
        alert('Please select a new status');
        return;
    }
    
    if (!confirm(`Are you sure you want to change order status to "${getStatusText(newStatus)}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountID,
                roles: roles.join(','),
                status: newStatus
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Status updated successfully!');
            
            // Reload orders and modal
            await loadOrders();
            await viewOrderDetail(orderId);
        } else {
            const error = await response.json();
            alert(error.error || 'Unable to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error connecting to server');
    }
}

// Recalculate order total (Admin only)
async function recalculateOrderTotal(orderId) {
    if (!confirm('Are you sure you want to recalculate this order total?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/recalculate-total`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`Recalculated successfully! New total: ${formatPrice(result.order.TotalAmount)}`);
            
            // Reload orders and modal
            await loadOrders();
            await viewOrderDetail(orderId);
        } else {
            const error = await response.json();
            alert(error.error || 'Unable to recalculate total');
        }
    } catch (error) {
        console.error('Error recalculating total:', error);
        alert('Error connecting to server');
    }
}

// Show discount form (Admin only)
async function showDiscountForm(orderId, orderNo) {
    // Load available discounts
    try {
        const response = await fetch(`${API_BASE}/discounts`);
        if (!response.ok) {
            throw new Error('Failed to load discounts');
        }
        
        const discounts = await response.json();
        
        if (discounts.length === 0) {
            alert('No discount codes available');
            return;
        }
        
        // Create select options
        let options = '<option value="">-- Select discount code --</option>';
        discounts.forEach(d => {
            const valueText = d.Type === 'percentage' ? `${d.Value}%` : formatPrice(d.Value);
            options += `<option value="${d.DiscountID}">${d.Name} - ${valueText} ${d.Conditions ? `(${d.Conditions})` : ''}</option>`;
        });
        
        const discountId = prompt(`Select discount code for item #${orderNo}:\n\n${discounts.map((d, i) => 
            `${i + 1}. ${d.Name} - ${d.Type === 'percentage' ? d.Value + '%' : formatPrice(d.Value)} ${d.Conditions ? '(' + d.Conditions + ')' : ''}`
        ).join('\n')}\n\nEnter number:`);
        
        if (discountId) {
            const index = parseInt(discountId) - 1;
            if (index >= 0 && index < discounts.length) {
                await applyDiscountToItem(orderId, orderNo, discounts[index].DiscountID);
            } else {
                alert('Invalid selection');
            }
        }
    } catch (error) {
        console.error('Error loading discounts:', error);
        alert('Error loading discount codes list');
    }
}

// Apply discount to order item (Admin only)
async function applyDiscountToItem(orderId, orderNo, discountId) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/apply-discount`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                discountID: discountId,
                orderNo: orderNo
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message || 'Discount code applied successfully!');
            
            // Reload orders and modal
            await loadOrders();
            await viewOrderDetail(orderId);
        } else {
            alert(result.message || result.error || 'Unable to apply discount code');
        }
    } catch (error) {
        console.error('Error applying discount:', error);
        alert('Error connecting to server');
    }
}

// Close order modal
function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeOrderModal();
    }
}

// Format price
function formatPrice(price) {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}
