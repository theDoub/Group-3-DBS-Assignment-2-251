// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Cart data
let cartData = null;
let appliedVouchers = [];

// Check authentication and load cart
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadCart();
});

// Check login status
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    const authSection = document.getElementById('authSection');
    
    if (isLoggedIn === 'true' && username) {
        authSection.innerHTML = `
            <span class="user-info">
                <i class="bi bi-person-circle icon-me-1"></i>
                ${username}
            </span>
            <button class="btn-logout" onclick="handleLogout()">
                <i class="bi bi-box-arrow-right icon-me-1"></i>
                Logout
            </button>
        `;
    } else {
        authSection.innerHTML = `
            <button class="btn-login" onclick="window.location.href='login.html'">Login</button>
        `;
        alert('Please login to view cart');
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

// Load cart from API
async function loadCart() {
    const loading = document.getElementById('loading');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const accountID = localStorage.getItem('accountID');
    
    if (!accountID) {
        loading.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart?account_id=${accountID}`);
        
        if (!response.ok) {
            throw new Error('Failed to load cart');
        }
        
        cartData = await response.json();
        
        console.log('Loaded cart data:', cartData);

        loading.style.display = 'none';

        // Check if data is an array (direct cart items) or object with items property
        const items = Array.isArray(cartData) ? cartData : (cartData.items || []);
        
        // Safe check - verify cartData and items exist before checking length
        if (!items || items.length === 0) {
            console.log('Cart is empty');
            emptyCart.style.display = 'block';
            cartContent.style.display = 'none';
        } else {
            console.log('Cart has', items.length, 'items');
            emptyCart.style.display = 'none';
            cartContent.style.display = 'block';
            renderCart();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        loading.textContent = 'Error loading cart';
    }
}

// Render cart items
function renderCart() {
    console.log('Rendering cart data:', cartData);

    const cartItemsList = document.getElementById('cartItemsList');
    cartItemsList.innerHTML = '';
    
    cartData.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="item-image">📚</div>
            <div class="item-details">
                <div class="item-title">${item.BookTitle}</div>
                <div class="item-format">FormatID: ${item.FormatID} | ${item.FormatType}</div>
                <div class="item-price">${formatPrice(item.Price)}</div>
            </div>
            <div class="item-actions">
                <div class="quantity-control">
                    <button onclick="updateQuantity(${item.ItemNo}, ${item.Quantity - 1})">-</button>
                    <input type="number" value="${item.Quantity}" min="1" readonly>
                    <button onclick="updateQuantity(${item.ItemNo}, ${item.Quantity + 1})">+</button>
                </div>
                <button class="btn-remove" onclick="removeItem(${item.ItemNo})"> 
                    <i class="bi bi-trash"></i>
                    Remove
                </button>
            </div>
        `;
        cartItemsList.appendChild(itemEl);
    });
    
    updateSummary();
}

// Update quantity
async function updateQuantity(itemNo, newQuantity) {
    if (newQuantity < 1) {
        if (!confirm('Do you want to remove this item from cart?')) {
            return;
        }
        await removeItem(itemNo);
        return;
    }
    
    const accountID = localStorage.getItem('accountID');
    if (!accountID) {
        alert('Please login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountID,
                cart_id: cartData.cartId,
                item_no: itemNo,
                quantity: newQuantity
            })
        });
        
        if (response.ok) {
            await loadCart();
        } else {
            const error = await response.json();
            alert(error.error || 'Unable to update quantity');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Error connecting to server');
    }
}

// Remove item from cart
async function removeItem(itemNo) {
    const accountID = localStorage.getItem('accountID');
    if (!accountID) {
        alert('Please login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart/item?account_id=${accountID}&cart_id=${cartData.cartId}&item_no=${itemNo}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadCart();
        } else {
            const error = await response.json();
            alert(error.error || 'Unable to remove item');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        alert('Error connecting to server');
    }
}

// Apply voucher
async function applyVoucher() {
    const voucherCode = document.getElementById('voucherCode').value.trim();
    const voucherMessage = document.getElementById('voucherMessage');
    
    if (!voucherCode) {
        voucherMessage.textContent = 'Please enter discount code';
        voucherMessage.className = 'error';
        return;
    }
    
    // Check if already applied
    if (appliedVouchers.some(v => v.code === voucherCode)) {
        voucherMessage.textContent = 'Discount code already applied';
        voucherMessage.className = 'error';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/discounts/validate?code=${voucherCode}`);
        const data = await response.json();
        
        if (data.valid) {
            appliedVouchers.push({
                code: voucherCode,
                discount: data.discount
            });
            
            voucherMessage.textContent = data.message;
            voucherMessage.className = 'success';
            document.getElementById('voucherCode').value = '';
            
            renderAppliedVouchers();
            updateSummary();
        } else {
            voucherMessage.textContent = data.message;
            voucherMessage.className = 'error';
        }
    } catch (error) {
        console.error('Error validating voucher:', error);
        voucherMessage.textContent = 'Error validating discount code';
        voucherMessage.className = 'error';
    }
}

// Render applied vouchers
function renderAppliedVouchers() {
    const appliedVouchersEl = document.getElementById('appliedVouchers');
    appliedVouchersEl.innerHTML = '';
    
    appliedVouchers.forEach((voucher, index) => {
        const voucherEl = document.createElement('div');
        voucherEl.className = 'applied-voucher';
        voucherEl.innerHTML = `
            <span>🎫 ${voucher.code}</span>
            <button onclick="removeVoucher(${index})">×</button>
        `;
        appliedVouchersEl.appendChild(voucherEl);
    });
}

// Remove voucher
function removeVoucher(index) {
    appliedVouchers.splice(index, 1);
    renderAppliedVouchers();
    updateSummary();
}

// Update summary
function updateSummary() {
    if (!cartData || !cartData.items.length) return;
    
    let subtotal = cartData.total;
    let discountAmount = 0;
    
    // Calculate discount
    appliedVouchers.forEach(voucher => {
        const discount = voucher.discount;
        if (discount.Type === 'percentage') {
            discountAmount += subtotal * (discount.Value / 100);
        } else if (discount.Type === 'fixed_amount') {
            discountAmount += discount.Value;
        }
    });
    
    const total = Math.max(0, subtotal - discountAmount);
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('totalAmount').textContent = formatPrice(total);
    
    if (discountAmount > 0) {
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discountAmount').textContent = '-' + formatPrice(discountAmount);
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }
}

// Proceed to checkout
async function proceedToCheckout() {
    if (!cartData || !cartData.items.length) {
        alert('Cart is empty');
        return;
    }
    
    const accountID = localStorage.getItem('accountID');
    const discountCodes = appliedVouchers.map(v => v.code);
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
    
    if (!deliveryAddress) {
        alert('Please enter delivery address!');
        document.getElementById('deliveryAddress').focus();
        return;
    }
    
    if (!confirm('Confirm order?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountID,
                discount_codes: discountCodes,
                delivery_address: deliveryAddress
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`Order placed successfully! Order ID: ${data.orderId}\nTotal: ${formatPrice(data.totalAmount)}`);
            window.location.href = 'orders.html';
        } else {
            alert('Error: ' + (data.error || 'Unable to place order'));
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Error connecting to server');
    }
}

// Format price
function formatPrice(price) {
    if (!price) return '0đ';
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(price);
}
