// Check admin role for books
function checkAdminRoleBooks() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.roles && user.roles.includes("Super Admin")) {
            document.getElementById('adminBooksContainer').style.display = 'flex';
        }
    } catch (e) {
        console.warn("Error checking user role:", e);
    }
}


let user = null;

// Wait for DOM to be ready before initialization
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation to page
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    try {
        user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            window.location.href = "login.html";
            return;
        }
    } catch(e) {
        console.error("Error accessing localStorage:", e);
        window.location.href = "login.html";
        return;
    }

    

    const welcomeUserEl = document.getElementById("welcomeUser");
    if (welcomeUserEl) {
        welcomeUserEl.innerText = `Hi, ${user.username}`;
    }

    const isAdmin = user.roles && user.roles.includes("Super Admin");

    // Show admin menu if user is admin
    const adminMenuEl = document.getElementById("adminMenu");
    if (adminMenuEl) {
        if (isAdmin) {
            console.log("User is Super Admin, showing admin menu");
            adminMenuEl.classList.remove('admin-menu-hidden');
            adminMenuEl.classList.add('admin-menu-visible');
        } else {
            console.log("User is NOT Super Admin, hiding admin menu");
            adminMenuEl.classList.remove('admin-menu-visible');
            adminMenuEl.classList.add('admin-menu-hidden');
        }
    } else {
        console.warn("adminMenu element not found");
    }

    // Hide cart navigation for admin users
    const cartNavItem = document.getElementById("cartNavItem");
    if (cartNavItem) {
        if (isAdmin) {
            cartNavItem.style.display = 'none';
            console.log("Cart navigation hidden for admin user");
        } else {
            cartNavItem.style.display = 'block';
        }
    }


    checkAdminRoleBooks();

    // Load Payments when modal opens
    const paymentModalEl = document.getElementById('paymentModal');
    if (paymentModalEl) {
        paymentModalEl.addEventListener('show.bs.modal', function() {
            loadPayments();
        });
    }

    // Load Deliveries when modal opens
    const deliveryModalEl = document.getElementById('deliveryModal');
    if (deliveryModalEl) {
        deliveryModalEl.addEventListener('show.bs.modal', function() {
            loadDeliveries();
        });
    }

    // Load categories with subcategories
    loadCategoriesWithSubcategories();

    // Search input event listener
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchBooks(this.value);
            // Show/hide clear button
            if (this.value.trim()) {
                clearSearch.style.display = 'block';
            } else {
                clearSearch.style.display = 'none';
            }
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', function () {
            searchInput.value = '';
            clearSearch.style.display = 'none';
            searchBooks('');
            searchInput.focus();
        });
    }

    // Load books
    loadBooks();
});

// Book image mapping
const bookImageMap = {
    'A Game of Thrones': 'images/game-of-thrones.jpg',
    'Harry Potter and the Philosopher\'s Stone': 'images/harry-potter.jpg',
    'Rich Dad Poor Dad': 'images/rich-dad-poor-dad.jpg',
    'Sapiens': 'images/sapiens.jpg'
};

// Book category mapping
const bookCategoryMap = {
    'A Game of Thrones': 'Fantasy',
    'Harry Potter and the Philosopher\'s Stone': 'Fantasy',
    'Rich Dad Poor Dad': 'Personal Finance',
    'Sapiens: A Brief History of Humankind': 'Self-Help'
};

let allBooks = [];
let currentFilter = 'all';
let currentSearch = '';

function searchBooks(query) {
    currentSearch = query.toLowerCase().trim();
    filterBooks();
}

function matchesSearch(book) {
    if (!currentSearch) return true;

    const searchLower = currentSearch;
    
    // Search in title
    if (book.Title.toLowerCase().includes(searchLower)) return true;
    
    // Search in description
    if (book.Description && book.Description.toLowerCase().includes(searchLower)) return true;
    
    // Search in authors
    if (book.Authors && book.Authors.toLowerCase().includes(searchLower)) return true;
    
    // Search in categories
    if (book.Categories && book.Categories.toLowerCase().includes(searchLower)) return true;
    
    return false;
}

function formatAudioDuration(seconds) {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function showBookDetails(bookId, title, authors) {
    // Find the book in allBooks
    const book = allBooks.find(b => b.BookID === bookId);
    if (!book) return;

    let formatsDetail = '';
    if (book.Formats) {
        const formats = typeof book.Formats === 'string' ? JSON.parse(book.Formats) : book.Formats;
        const printedFormatIndex = formats.findIndex(f => f.FormatType === 'Printed');
        
        formatsDetail = formats.map((f, index) => {
            let typeInfo = `<strong>${f.FormatType}</strong> - $${f.Price}`;
            let isReprint = false;
            
            // Check if this is a reprint (Game of Thrones with price 16.5)
            if (f.FormatType === 'Printed' && f.Price === 16.5 && book.PublisherName) {
                typeInfo += ` <span class="badge ms-2" style="background-color: var(--accent); color: white;">Reprinted</span>`;
                isReprint = true;
            }
            
            // Add format-specific details
            if (f.FormatType === 'Audio' && f.AudioDuration) {
                typeInfo += ` | Duration: ${formatAudioDuration(f.AudioDuration)}`;
            } else if (f.FormatType === 'Printed') {
                if (f.PageCount) typeInfo += ` | Pages: ${f.PageCount}`;
                if (f.Weight) typeInfo += ` | Weight: ${f.Weight}g`;
            } else if (f.FormatType === 'E' && f.EBookFormat) {
                typeInfo += ` | Format: ${f.EBookFormat}`;
            }
            
            // Add publication date for printed books
            if (f.FormatType === 'Printed' && f.PublicationDate) {
                const pubDate = new Date(f.PublicationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                typeInfo += ` | Published: ${pubDate}`;
            }
            
            return `<li class="mb-3">${typeInfo}</li>`;
        }).join('');
    }

    // Fetch reviews and rating for this book
    Promise.all([
        fetch(`http://127.0.0.1:5000/api/reviews/book/${bookId}`).then(r => r.json()),
        fetch(`http://127.0.0.1:5000/api/reviews/book/${bookId}/average`).then(r => r.json())
    ]).then(([reviews, ratingData]) => {
        const avgRating = ratingData.AverageRating || 0;
        const totalReviews = ratingData.TotalReviews || 0;
        
        let reviewsHtml = '';
        if (totalReviews > 0) {
            const stars = '⭐'.repeat(Math.round(avgRating));
            reviewsHtml = `
                <div class="mb-3 p-3" style="background: #f8f9fa; border-radius: 8px;">
                    <p class="mb-2"><strong><i class="bi bi-star-fill text-warning"></i> Rating:</strong> ${avgRating.toFixed(1)} / 5.0 ${stars} (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})</p>
                </div>
                <p class="mb-2"><strong><i class="bi bi-chat-left-quote"></i> Customer Reviews:</strong></p>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${reviews.map(r => `
                        <div class="mb-3 p-3 border rounded">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <strong>${r.CustomerName || 'Anonymous'}</strong>
                                    <div>${'⭐'.repeat(r.Rating)}</div>
                                </div>
                                <small class="text-muted">${new Date(r.ReviewDate).toLocaleDateString()}</small>
                            </div>
                            ${r.Comment ? `<p class="mb-0 small">${r.Comment}</p>` : '<p class="mb-0 small text-muted">No comment provided</p>'}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        Swal.fire({
            title: title,
            html: `
                <div class="text-start">
                    <p class="mb-2">
                        <strong><i class="bi bi-person"></i> Authors:</strong> ${authors || 'Unknown'}
                    </p>
                    <p class="mb-2">
                        <strong><i class="bi bi-tag"></i> Category:</strong> ${book.Categories || 'General'}
                    </p>
                    <p class="mb-2">
                        <strong><i class="bi bi-building"></i> Publishers:</strong> ${book.PublisherName || 'Unknown'}
                    </p>
                    ${book.Contact ? `<p class="mb-3"><strong><i class="bi bi-telephone"></i> Contact:</strong><br><small>${book.Contact}</small></p>` : ''}
                    <p class="mb-3">
                        <strong><i class="bi bi-file-text"></i> Description:</strong><br>
                        ${book.Description || 'No description available.'}
                    </p>
                    <p class="mb-2"><strong><i class="bi bi-box"></i> Available Formats:</strong></p>
                    <ul class="text-start" style="list-style-position: inside;">
                        ${formatsDetail}
                    </ul>
                    <hr class="my-3">
                    ${reviewsHtml}
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Close',
            width: '700px'
        });
    }).catch(err => {
        console.error('Error loading reviews:', err);
        // Show modal without reviews if fetch fails
        Swal.fire({
            title: title,
            html: `
                <div class="text-start">
                    <p class="mb-2">
                        <strong><i class="bi bi-person"></i> Authors:</strong> ${authors || 'Unknown'}
                    </p>
                    <p class="mb-2">
                        <strong><i class="bi bi-tag"></i> Category:</strong> ${book.Categories || 'General'}
                    </p>
                    <p class="mb-2">
                        <strong><i class="bi bi-building"></i> Publishers:</strong> ${book.PublisherName || 'Unknown'}
                    </p>
                    ${book.Contact ? `<p class="mb-3"><strong><i class="bi bi-telephone"></i> Contact:</strong><br><small>${book.Contact}</small></p>` : ''}
                    <p class="mb-3">
                        <strong><i class="bi bi-file-text"></i> Description:</strong><br>
                        ${book.Description || 'No description available.'}
                    </p>
                    <p class="mb-2"><strong><i class="bi bi-box"></i> Available Formats:</strong></p>
                    <ul class="text-start" style="list-style-position: inside;">
                        ${formatsDetail}
                    </ul>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Close',
            width: '700px'
        });
    });
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

function getBookImage(title) {
    for (let bookTitle in bookImageMap) {
        if (title.toLowerCase().includes(bookTitle.toLowerCase()) ||
            bookTitle.toLowerCase().includes(title.toLowerCase())) {
            return bookImageMap[bookTitle];
        }
    }
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `https://placehold.co/300x400/${randomColor}/ffffff?text=${encodeURIComponent(title)}
`;
}

function getBookCategory(book) {
    // If book has Categories from API, use it (prioritize actual data)
    if (book.Categories && book.Categories.trim()) {
        // Get the first category if multiple
        const categories = book.Categories.split(',');
        return categories[0].trim();
    }
    
    // Fallback to mapping if API data not available
    for (let bookTitle in bookCategoryMap) {
        if (book.Title.toLowerCase().includes(bookTitle.toLowerCase()) ||
            bookTitle.toLowerCase().includes(book.Title.toLowerCase())) {
            return bookCategoryMap[bookTitle];
        }
    }
    return 'General';
}

function filterBooks() {
    const container = document.getElementById("books");
    if (!container) return;
    
    container.innerHTML = "";

    // Apply both category filter and search filter
    let filtered = currentFilter === 'all'
        ? allBooks
        : allBooks.filter(b => getBookCategory(b) === currentFilter);

    // Apply search filter
    filtered = filtered.filter(b => matchesSearch(b));

    if (filtered.length === 0) {
        if (currentSearch) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">No books found matching your search.</div>';
        } else {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">No books found in this category.</div>';
        }
        return;
    }

    // Use Promise.all to fetch all ratings first, then render once
    Promise.all(filtered.map(b => {
        return fetch(`http://127.0.0.1:5000/api/reviews/book/${b.BookID}/average`)
            .then(r => r.json())
            .then(ratingData => ({ book: b, rating: ratingData }))
            .catch(err => {
                console.error('Error loading rating for book:', b.BookID, err);
                return { book: b, rating: null };
            });
    })).then(booksWithRatings => {
        const allCardsHtml = booksWithRatings.map(({ book: b, rating }) => {
            let formatsHtml = '<div class="mt-2"><small class="text-muted d-block mb-1">Select format:</small>';

            let minPrice = null;

            if (b.Formats) {
                const formats = typeof b.Formats === 'string' ? JSON.parse(b.Formats) : b.Formats;

                if (Array.isArray(formats)) {
                    formats.sort((x, y) => x.Price - y.Price);
                    const safeTitle = b.Title.replace(/'/g, "\\'");

                    formats.forEach(f => {
                        if (minPrice === null || f.Price < minPrice) {
                            minPrice = f.Price;
                        }
                    });

                    formatsHtml += formats.map(f => `
                        <button onclick="buy('${f.FormatID}', '${safeTitle}', '${f.FormatType}')"
    class="btn btn-sm mb-2 w-100 d-block format-badge" style="border-color: var(--primary); color: var(--primary);">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="small"><i class="bi bi-cart-plus me-1"></i>${f.FormatType}</span>
                                <span class="price-tag small">$${f.Price}</span>
                            </div>
                        </button>
                    `).join('');
                }
            }
            formatsHtml += '</div>';

            const imgUrl = getBookImage(b.Title);
            const category = getBookCategory(b);
            const displayPrice = minPrice !== null ? `$${minPrice}` : '—';

            // const avgRating = rating ? (rating.AverageRating || 0) : 0;
            // const totalReviews = rating ? (rating.TotalReviews || 0) : 0;
            
            // let ratingHtml = '';
            // if (totalReviews >= 0) {
            //     const stars = '⭐'.repeat(Math.round(avgRating));
            //     ratingHtml = `
            //         <div class="mt-2 d-flex align-items-center gap-1" style="font-size: 0.85rem;">
            //             <span>${stars}</span>
            //             <span class="text-muted">${avgRating.toFixed(1)} (${totalReviews})</span>
            //         </div>
            //     `;
            // }
            
            return `
                <div class="col">
                    <div class="card h-100 book-card">
                        <img src="${imgUrl}" class="card-img-top book-cover" alt="${b.Title}" style="cursor: pointer;"
                                onclick="showBookDetails('${b.BookID}', '${b.Title.replace(/'/g, "\\'")}', '${b.Authors || 'Unknown Author'}')"
                                onerror="this.src='https://via.placeholder.com/600x800/cccccc/ffffff?text=${encodeURIComponent(b.Title)}'">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h5 class="card-title fw-semibold text-truncate me-1" style="color: var(--primary);" title="${b.Title}" style="cursor: pointer;"
                                    onclick="showBookDetails('${b.BookID}', '${b.Title.replace(/'/g, "\\'")}', '${b.Authors || 'Unknown Author'}')">
                                    ${b.Title}
                                </h5>
                                <span class="badge bg-light text-muted border category-pill">
                                    ${category}
                                </span>
                            </div>

                            <p class="card-text text-muted desc-truncate mb-2" style="cursor: pointer;"
                                onclick="showBookDetails('${b.BookID}', '${b.Title.replace(/'/g, "\\'")}', '${b.Authors || 'Unknown Author'}')">
                                ${b.Description || 'No description available.'}
                            </p>
                            
                            

                            <div class="card-footer-like mt-auto pt-1">
                                ${formatsHtml}
                            </div>

                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Set all HTML at once to prevent duplicates
        container.innerHTML = allCardsHtml;
    });
}

function loadBooks() {
    fetch("http://127.0.0.1:5000/api/books")
        .then(res => res.json())
        .then(data => {
            allBooks = data;
            const loadingEl = document.getElementById("loading");
            if (loadingEl) {
                loadingEl.style.display = "none";
            }
            console.log("Books loaded:", allBooks);
            filterBooks();
        })
        .catch(() => {
            const loadingEl = document.getElementById("loading");
            if (loadingEl) {
                loadingEl.innerHTML =
                    '<div class="text-danger small">Failed to load books. Please ensure the backend is running.</div>';
            }
        });
}

function buy(formatId, title, type) {
    // Check if user is an administrator
    if (user && user.roles && user.roles.includes("Super Admin")) {
        Swal.fire({
            icon: 'warning',
            title: 'Admin Account',
            text: 'Administrators cannot add items to cart. Please use a customer account to make purchases.',
            confirmButtonColor: 'var(--primary)'
        });
        return;
    }

    Swal.fire({
        title: `Add to Cart`,
        html: `Book: <b style="color: var(--primary);">${title}</b><br>Format: <span style="color: var(--accent-2);">${type}</span>`,
        input: 'number',
        inputValue: 1,
        inputLabel: 'Quantity',
        inputAttributes: { min: 1, max: 100, step: 1 },
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-cart-check"></i> Add Now',
        confirmButtonColor: 'var(--primary)',
    }).then((result) => {
        if (result.isConfirmed) {
            const qty = parseInt(result.value);
            if (qty > 0) {
                fetch('http://127.0.0.1:5000/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId: user.accountID, formatId: formatId, quantity: qty })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) {
                            Swal.fire('Error', data.error, 'error');
                        } else {
                            const Toast = Swal.mixin({
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 3000,
                                timerProgressBar: true
                            });
                            Toast.fire({ icon: 'success', title: 'Added to cart successfully', position: 'bottom-right' });
                        }
                    })
                    .catch(() => Swal.fire('Error', 'Failed to connect server', 'error'));
            }
        }
    });
}

///// ADMIN ACTIONS //////
function loadPayments() {
    const paymentList = document.getElementById('paymentList');
    if (!paymentList) return;
    
    paymentList.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

    fetch('http://127.0.0.1:5000/api/admin/payments')
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                paymentList.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-inbox" style="font-size: 2rem;"></i><br>No payments pending</div>';
                return;
            }

            paymentList.innerHTML = data.map(payment => `
                <div class="card border-1 rounded-3" style="background: rgba(13,110,253,0.05);">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="fw-bold mb-1" style="color: var(--primary);">Order #${payment.OrderID}</h6>
                                <small class="text-muted"><i class="bi bi-person me-1"></i>${payment.CustomerName}</small>
                            </div>
                            <span class="badge" style="background: rgba(13,110,253,0.2); color: var(--primary);">
                                <i class="bi bi-hourglass-split me-1"></i>${payment.Status.toUpperCase()}
                            </span>
                        </div>
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted d-block">Amount</small>
                                <strong class="fs-5" style="color: var(--accent);">$${payment.TotalAmount}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Method</small>
                                <strong class="fs-5">${payment.Method}</strong>
                            </div>
                        </div>
                        <small class="text-muted d-block mb-3">Date: ${new Date(payment.PaymentDate).toLocaleDateString()}</small>
                        <button onclick="approvePayment('${payment.PaymentID}', '${payment.OrderID}')" class="btn btn-sm w-100" style="background: var(--primary) !important; color: white; border: none;">
                            <i class="bi bi-check-circle me-1"></i>Approve Payment
                        </button>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('Error loading payments:', err);
            paymentList.innerHTML = '<div class="alert alert-danger">Failed to load payments</div>';
        });
}

function loadDeliveries() {
    const deliveryList = document.getElementById('deliveryList');
    if (!deliveryList) return;
    
    deliveryList.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

    fetch('http://127.0.0.1:5000/api/admin/deliveries')
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                deliveryList.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-inbox" style="font-size: 2rem;"></i><br>No deliveries to manage</div>';
                return;
            }

            deliveryList.innerHTML = data.map(delivery => `
                <div class="card border-1 rounded-3" style="background: rgba(13,110,253,0.05);">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="fw-bold mb-1" style="color: var(--primary);">Order #${delivery.OrderID}</h6>
                                <small class="text-muted"><i class="bi bi-person me-1"></i>${delivery.CustomerName}</small>
                            </div>
                            <span class="badge" style="background: rgba(13,110,253,0.2); color: var(--primary);">
                                <i class="bi bi-truck me-1"></i>${delivery.Status.toUpperCase()}
                            </span>
                        </div>
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted d-block">Carrier</small>
                                <strong>${delivery.Carrier || 'N/A'}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Tracking</small>
                                <strong>${delivery.TrackingNumber || 'N/A'}</strong>
                            </div>
                        </div>
                        <button onclick="updateDelivery('${delivery.DeliveryID}', '${delivery.OrderID}')" class="btn btn-sm w-100" style="background: var(--primary); color: white; border: none;">
                            <i class="bi bi-pencil me-1"></i>Update Status
                        </button>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('Error loading deliveries:', err);
            deliveryList.innerHTML = '<div class="alert alert-danger">Failed to load deliveries</div>';
        });
}

function approvePayment(paymentId, orderId) {
    Swal.fire({
        title: 'Approve Payment?',
        text: `Confirm payment for Order #${orderId}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        confirmButtonColor: 'var(--primary)'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`http://127.0.0.1:5000/api/admin/payments/${paymentId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminAccountId: user.accountID })
            })
            .then(res => res.json())
            .then(data => {
                Swal.fire('Success!', 'Payment approved and order confirmed', 'success');
                loadPayments();
            })
            .catch(err => Swal.fire('Error', 'Failed to approve payment', 'error'));
        }
    });
}

function updateDelivery(deliveryId, orderId) {
    Swal.fire({
        title: 'Update Delivery Status',
        input: 'select',
        inputOptions: {
            'preparing': 'Preparing',
            'shipped': 'Shipped',
            'delivering': 'Delivering',
            'delivered': 'Delivered',
            'failed': 'Failed',
            'cancelled': 'Cancelled'
        },
        showCancelButton: true,
        confirmButtonText: 'Update',
        confirmButtonColor: 'var(--primary)'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`http://127.0.0.1:5000/api/admin/deliveries/${deliveryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: result.value,
                    adminAccountId: user.accountID 
                })
            })
            .then(res => res.json())
            .then(data => {
                Swal.fire('Success!', 'Delivery status updated', 'success');
                loadDeliveries();
            })
            .catch(err => Swal.fire('Error', 'Failed to update delivery', 'error'));
        }
    });
}




////// SUBCATEGORY FUNCTIONS //////
// Load categories and their subcategories
function loadCategoriesWithSubcategories() {
    console.log("[loadCategoriesWithSubcategories] Fetching categories...");
    
    fetch("http://127.0.0.1:5000/api/categories/sub-categories")
        .then(res => {
            console.log("Response status:", res.status);
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON but got ${contentType}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Categories data:", data);
            populateCategoryFilters(data);
        })
        .catch(err => {
            console.error('Error loading categories:', err);
        });
}

// Populate the existing category filter bar with subcategories
function populateCategoryFilters(categories) {
    const categoryScroll = document.querySelector('.category-scroll');
    if (!categoryScroll) return;

    // Keep the "All Categories" button
    categoryScroll.innerHTML = `
        <button class="btn btn-sm active category-filter" data-category="all" onclick="handleCategoryClick(event, 'all')">
            <i class="bi bi-globe2"></i> All Categories
        </button>
    `;

    // Add each category as a button WITH subcategories dropdown
    categories.forEach(category => {
        const icon = getCategoryIcon(category.CategoryName);
        
        // Parse subcategories
        let subCategories = [];
        if (category.SubCategories) {
            if (typeof category.SubCategories === 'string') {
                try {
                    subCategories = JSON.parse(category.SubCategories);
                } catch (e) {
                    console.warn("Failed to parse subcategories:", e);
                }
            } else {
                subCategories = Array.isArray(category.SubCategories) ? category.SubCategories : [];
            }
        }

        // Filter out null subcategories
        subCategories = subCategories.filter(sub => sub && sub.Name && sub.Name !== 'null');

        // Create category button with subcategories container
        const categoryButtonHtml = `
            <div class="category-with-sub" style="position: relative; display: inline-block;">
                <button class="btn btn-sm category-filter" data-category="${category.CategoryName || ''}" title="${category.CategoryName}" onclick="handleCategoryClick(event, '${category.CategoryName || ''}')">
                    <i class="bi ${icon}"></i> ${category.CategoryName}
                    ${subCategories.length > 0 ? '<i class="bi bi-chevron-down ms-1 sub-toggle-icon" style="font-size: 0.7rem;"></i>' : ''}
                </button>
                ${subCategories.length > 0 ? `
                    <div class="subcategory-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: white; border: 1px solid #ddd; border-radius: 8px; min-width: 250px; max-height: 150px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-top: 4px; z-index: 1000;">
                        ${subCategories.map(sub => `
                            <button class="subcategory-btn" onclick="filterBySubcategory(${sub.SubCategoryID}, '${sub.Name}')" style="display: block; width: 100%; padding: 12px 16px; text-align: left; background: none; border: none; cursor: pointer; color: var(--dark-text); font-size: 0.9rem; transition: all 0.2s; border-left: 3px solid transparent; white-space: nowrap;">
                                <i class="bi bi-tag-fill" style="color: var(--accent); margin-right: 8px;"></i>${sub.Name}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        categoryScroll.innerHTML += categoryButtonHtml;
    });

    // Re-attach click listeners to all category filters
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Don't filter if clicking the chevron
            if (e.target.classList.contains('sub-toggle-icon')) {
                return;
            }
            document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-category');
            filterBooks();
        });
    });
}


// Handle category click - toggle dropdown OR filter by category
function handleCategoryClick(event, categoryName) {
    event.preventDefault();
    const button = event.currentTarget;
    const dropdown = button.nextElementSibling;
    
    // Check if this category has subcategories
    const hasSubcategories = dropdown && dropdown.classList.contains('subcategory-dropdown');
    
    if (hasSubcategories) {
        // If it has subcategories, toggle the dropdown (don't filter yet)
        const isVisible = dropdown.style.display !== 'none';
        
        // Hide all other dropdowns
        document.querySelectorAll('.subcategory-dropdown').forEach(d => d.style.display = 'none');
        
        // Toggle current dropdown
        dropdown.style.display = isVisible ? 'none' : 'block';

        console.log(`Toggling subcategory dropdown for category: ${categoryName}`);
    } else {
        // If no subcategories, filter by category immediately
        document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        // Close all dropdowns
        document.querySelectorAll('.subcategory-dropdown').forEach(d => d.style.display = 'none');
        
        // Filter books by category
        currentFilter = categoryName;
        currentSearch = '';
        
        // Clear search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        console.log(`Filtering by category: ${categoryName}`);
        filterBooks();
    }
}

// Toggle subcategory dropdown
function toggleSubcategoryDropdown(event) {
    event.preventDefault();
    const dropdown = event.currentTarget.nextElementSibling;
    if (dropdown && dropdown.classList.contains('subcategory-dropdown')) {
        const isVisible = dropdown.style.display !== 'none';
        
        // Hide all other dropdowns
        document.querySelectorAll('.subcategory-dropdown').forEach(d => d.style.display = 'none');
        
        // Toggle current dropdown
        dropdown.style.display = isVisible ? 'none' : 'block';
    }
}

// Get icon for category
function getCategoryIcon(categoryName) {
    const icons = {
        'Literature': 'bi-book',
        'Fantasy': 'bi-book-half',
        'Personal Finance': 'bi-graph-up',
        'Self-Help': 'bi-lightbulb',
        'Science Fiction': 'bi-rocket',
        'Business': 'bi-briefcase',
    };
    return icons[categoryName] || 'bi-collection';
}

// Filter books by subcategory
function filterBySubcategory(subcategoryId, subcategoryName) {
    // Ignore null subcategories
    if (!subcategoryName || subcategoryName === 'null' || subcategoryName.trim() === '') {
        console.warn("Ignoring null/empty subcategory");
        return;
    }


    console.log(`Filtering by subcategory ID: ${subcategoryId}, Name: ${subcategoryName}`);
    // Update category filter button styling
    document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
    // Find and mark the parent category button as active
    const parentButton = event?.currentTarget?.closest('.category-with-sub')?.querySelector('.category-filter');
    if (parentButton) {
        parentButton.classList.add('active');
    }
    
    
    
    // Filter by the subcategory name instead of searching
    currentFilter = subcategoryName;
    currentSearch = '';
    
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }

    // Close the dropdown
    document.querySelectorAll('.subcategory-dropdown').forEach(d => d.style.display = 'none');

    // Filter and display books
    filterBooks();

    // Scroll to books section
    const booksSection = document.getElementById('booksSection');
    if (booksSection) {
        booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// ========== CREATE BOOK ==========
function openCreateBookModal() {
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Book Title *</label>
            <input type="text" class="form-control" id="bookTitle" placeholder="Enter book title">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Description</label>
            <textarea class="form-control" id="bookDescription" rows="3" placeholder="Book description"></textarea>
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Category ID*</label>
            <input type="text" class="form-control" id="bookCategory" placeholder="e.g., 1 (Literature), 2 (Science Fiction)">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Edition Language *</label>
            <input type="text" class="form-control" id="editionLanguage" placeholder="e.g., English" value="English">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Edition Price *</label>
            <input type="number" class="form-control" id="editionPrice" placeholder="Price" step="0.01" min="0">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Publisher ID *</label>
            <input type="number" class="form-control" id="publisherID" placeholder="Publisher ID" step="1" min="1">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Format Type *</label>
            <select class="form-select" id="formatType" required>
                <option value="">-- Select Format --</option>
                <option value="Printed">Printed</option>
                <option value="E">E</option>
                <option value="Audio">Audio</option>
            </select>
        </div>
        <button class="btn btn-success w-100" onclick="createBookSubmit()">
            <i class="bi bi-check-circle me-1"></i>Create Book
        </button>
    `;
    document.getElementById('bookModalTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Create New Book';
    document.getElementById('bookModalContent').innerHTML = html;
    new bootstrap.Modal(document.getElementById('bookModal')).show();
}

function createBookSubmit() {
    const title = document.getElementById('bookTitle').value.trim();
    const category = document.getElementById('bookCategory').value;
    const price = document.getElementById('editionPrice').value;
    const publisherID = document.getElementById('publisherID').value;
    const formatType = document.getElementById('formatType').value;
    
    if (!title) {
        Swal.fire('Error', 'Book title is required', 'error');
        return;
    }
    if (!category) {
        Swal.fire('Error', 'Category is required', 'error');
        return;
    }
    if (!price) {
        Swal.fire('Error', 'Edition price is required', 'error');
        return;
    }
    if (!publisherID) {
        Swal.fire('Error', 'Publisher ID is required', 'error');
        return;
    }
    if (!formatType) {
        Swal.fire('Error', 'Format type is required', 'error');
        return;
    }

    fetch("http://127.0.0.1:5000/api/admin/books", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Title: title,
            Description: document.getElementById('bookDescription').value || null,
            CategoryID: category,
            EditionLanguage: document.getElementById('editionLanguage').value || 'English',
            EditionPrice: parseFloat(price),
            PublisherID: parseInt(publisherID),
            FormatType: formatType
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success', 'Book created successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
            loadBooks();
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to create book', 'error');
        });
}

// ========== EDIT BOOK ==========
function openEditBookModal() {
    if (allBooks.length === 0) {
        Swal.fire('Info', 'No books available', 'info');
        return;
    }

    const options = allBooks.map(b => `<option value="${b.BookID}">${b.Title}</option>`).join('');
    
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Select Book *</label>
            <select class="form-select" id="selectBook" onchange="loadBookToEdit()">
                <option value="">-- Choose a book --</option>
                ${options}
            </select>
        </div>
        <div id="editBookForm" style="display: none;">
            <div class="mb-3">
                <label class="form-label fw-bold">Book Title *</label>
                <input type="text" class="form-control" id="editBookTitle">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Description</label>
                <textarea class="form-control" id="editBookDescription" rows="3"></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Category ID *</label>
                <input type="text" class="form-control" id="editBookCategory">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Edition Language *</label>
                <input type="text" class="form-control" id="editEditionLanguage" value="English">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Edition Price *</label>
                <input type="number" class="form-control" id="editEditionPrice" step="0.01" min="0">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Publisher ID *</label>
                <input type="number" class="form-control" id="editPublisherID" min="1">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Format Type *</label>
                <select class="form-select" id="editFormatType" required>
                    <option value="Printed">Printed</option>
                    <option value="E">E-Book</option>
                    <option value="Audio">Audio</option>
                </select>
            </div>
            <button class="btn btn-warning w-100" onclick="editBookSubmit()">
                <i class="bi bi-pencil me-1"></i>Update Book
            </button>
        </div>
    `;
    document.getElementById('bookModalTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Book';
    document.getElementById('bookModalContent').innerHTML = html;
    new bootstrap.Modal(document.getElementById('bookModal')).show();
}

function loadBookToEdit() {
    const id = document.getElementById('selectBook').value;
    if (!id) return;
    
    const book = allBooks.find(b => b.BookID == id);
    if (!book) return;

    document.getElementById('editBookForm').style.display = 'block';
    document.getElementById('editBookTitle').value = book.Title;
    document.getElementById('editBookDescription').value = book.Description || '';
    document.getElementById('editBookCategory').value = book.CategoryName || '';
    document.getElementById('editEditionLanguage').value = 'English';
    document.getElementById('editEditionPrice').value = book.Formats ? JSON.parse(book.Formats)[0]?.Price || '' : '';
}

function editBookSubmit() {
    const id = document.getElementById('selectBook').value;
    const title = document.getElementById('editBookTitle').value.trim();
    const category = document.getElementById('editBookCategory').value;
    const price = document.getElementById('editEditionPrice').value;
    const publisherID = document.getElementById('editPublisherID').value;
    
    if (!title) {
        Swal.fire('Error', 'Book title is required', 'error');
        return;
    }

    fetch(`http://127.0.0.1:5000/api/admin/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Title: title,
            Description: document.getElementById('editBookDescription').value || null,
            CategoryID: category,
            EditionLanguage: document.getElementById('editEditionLanguage').value || 'English',
            EditionPrice: parseFloat(price),
            PublisherID: parseInt(publisherID),
            FormatType: document.getElementById('editFormatType').value
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success', 'Book updated successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
            loadBooks();
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to update book', 'error');
        });
}

// ========== DELETE BOOK ========== (unchanged)
function deleteBook() {
    if (allBooks.length === 0) {
        Swal.fire('Info', 'No books available', 'info');
        return;
    }

    const options = allBooks.map(b => `<option value="${b.BookID}">${b.Title}</option>`).join('');
    
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Select Book *</label>
            <select class="form-select" id="deleteBookId">
                <option value="">-- Choose a book --</option>
                ${options}
            </select>
        </div>
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This will delete the book and all its editions and formats!
        </div>
        <button class="btn btn-danger w-100" onclick="deleteBookSubmit()">
            <i class="bi bi-trash me-1"></i>Delete Book
        </button>
    `;
    document.getElementById('bookModalTitle').innerHTML = '<i class="bi bi-trash me-2"></i>Delete Book';
    document.getElementById('bookModalContent').innerHTML = html;
    new bootstrap.Modal(document.getElementById('bookModal')).show();
}

function deleteBookSubmit() {
    const id = document.getElementById('deleteBookId').value;
    if (!id) {
        Swal.fire('Error', 'Please select a book', 'error');
        return;
    }

    console.log("[deleteBookSubmit] Deleting book with ID:", id);

    Swal.fire({
        title: 'Confirm Delete?',
        text: 'This will delete the book and all its editions and formats!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`http://127.0.0.1:5000/api/admin/books/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(r => {
                    console.log("[deleteBookSubmit] Response status:", r.status);
                    return r.json();
                })
                .then(data => {
                    console.log("[deleteBookSubmit] Response data:", data);
                    if (data.message) {
                        Swal.fire('Success', 'Book deleted successfully', 'success');
                        bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
                        loadBooks();
                    } else {
                        throw new Error(data.error || 'Failed to delete book');
                    }
                })
                .catch(e => {
                    console.error('[deleteBookSubmit] Error:', e);
                    Swal.fire('Error', e.message || 'Failed to delete book', 'error');
                });
        }
    });
}