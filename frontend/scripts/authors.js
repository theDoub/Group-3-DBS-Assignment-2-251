// Check admin role
function checkAdminRole() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.roles && user.roles.includes("Super Admin")) {
            document.getElementById('adminActionsContainer').style.display = 'flex';
        }
    } catch (e) {
        console.warn("Error checking user role:", e);
    }
}


let allAuthors = [];
let topAuthors = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAdminRole();

    loadAllAuthors();
    
    // Load top authors when tab is clicked
    document.getElementById('top-authors-tab').addEventListener('click', function() {
        if (topAuthors.length === 0) {
            loadTopSellingAuthors();
        }
    });
});

// Load all authors
function loadAllAuthors() {
    console.log("[loadAllAuthors] Fetching all authors...");
    
    fetch("http://127.0.0.1:5000/api/authors")
        .then(res => res.json())
        .then(data => {
            console.log("Authors data:", data);
            allAuthors = data;
            displayAuthors(data, 'allAuthorsContainer');
        })
        .catch(err => {
            console.error('Error loading authors:', err);
            document.getElementById('allAuthorsContainer').innerHTML = '<div class="col-12 text-center text-danger py-5"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load authors</div>';
        });
}

// Load top selling authors
function loadTopSellingAuthors() {
    console.log("[loadTopSellingAuthors] Fetching top selling authors...");
    
    fetch("http://127.0.0.1:5000/api/authors/top-selling")
        .then(res => res.json())
        .then(data => {
            console.log("Top authors data:", data);
            displayTopSellingAuthors(data)
        })
        .catch(err => {
            console.error('Error loading top authors:', err);
            document.getElementById('topAuthorsContainer').innerHTML = '<div class="col-12 text-center text-danger py-5"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load top authors</div>';
        });
}

// Display authors
function displayAuthors(authors, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!authors || authors.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-inbox me-2"></i>No authors found</div>';
        return;
    }

    authors.forEach(author => {
        const initials = author.Name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
        
        const authorCard = `
            <div class="col-md-6 col-lg-4">
                <div class="author-card" onclick="showAuthorDetails('${author.AuthorID}', '${author.Name}', '${author.Biography || ''}', '${author.BirthDate || ''}', '${author.Nationality || ''}', ${author.TotalBooks || 0})">
                    <div class="author-card-header">
                        <div class="author-avatar">${initials}</div>
                        <h5 class="author-name">${author.Name}</h5>
                        ${author.Nationality ? `<p class="author-nationality"><i class="bi bi-geo-alt-fill me-1"></i>${author.Nationality}</p>` : ''}
                    </div>
                    <div class="author-card-body">
                        ${author.Biography ? `<p class="author-bio truncated">${author.Biography}</p>` : ''}
                        <div class="author-info">
                            ${author.TotalBooks ? `<span class="info-badge"><i class="bi bi-book me-1"></i>${author.TotalBooks} Books</span>` : ''}
                        </div>
                        <div class="author-actions">
                            <button class="btn btn-view-details">
                                <i class="bi bi-person-circle me-1"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML += authorCard;
    });
}

// Show author details modal
function showAuthorDetails(authorId, name, biography, birthDate, nationality, totalBooks) {
    const birthYear = birthDate ? new Date(birthDate).getFullYear() : 'N/A';
    
    const detailsHtml = `
        <div class="author-modal-details">
            <div class="text-center mb-4">
                <div style="width: 120px; height: 120px; background: linear-gradient(125deg, var(--primary) 50%, var(--primary-gradient) 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; font-weight: bold;">
                    ${name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                </div>
                <h4 class="mt-3 fw-bold">${name}</h4>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-2"><i class="bi bi-calendar me-2" style="color: var(--primary);"></i>Birth Year</h6>
                    <p>${birthYear}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-2"><i class="bi bi-geo-alt-fill me-2" style="color: var(--primary);"></i>Nationality</h6>
                    <p>${nationality || 'Not specified'}</p>
                </div>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold mb-2"><i class="bi bi-book me-2" style="color: var(--primary);"></i>Total Books</h6>
                <p class="badge bg-primary" style="font-size: 1rem; padding: 0.75rem 1.5rem;">${totalBooks} Books</p>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold mb-2"><i class="bi bi-file-text me-2" style="color: var(--primary);"></i>Biography</h6>
                <p>${biography || 'No biography available'}</p>
            </div>
        </div>
    `;

    document.getElementById('authorDetails').innerHTML = detailsHtml;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}

//  Display top selling authors
function displayTopSellingAuthors(authors) {
    const container = document.getElementById('topAuthorsContainer');
    if (!container) return;
    container.innerHTML = '';
    console.log("Displaying top authors:", authors);
    if (!authors || authors.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-inbox me-2"></i>No top authors found</div>';
        return;
    }
    authors.forEach(author => {
        console.log("Top author:", author);
        const initials = author.AuthorName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
        const authorCard = `
            <div class="col-md-6 col-lg-4">
                <div class="author-card" onclick="showAuthorDetails('${author.AuthorID}', '${author.AuthorName}')">
                    <div class="author-card-header">
                        <div class="author-avatar">${initials}</div>
                        <h5 class="author-name">${author.AuthorName}</h5>
                    </div>
                    <div class="author-card-body">
                        <div class="author-info">
                            <span class="info-badge"><i class="bi bi-star-fill me-1"></i>${author.TotalQuantitySold} Books</span>
                            <span class="info-badge"><i class="bi bi-bookmark-check me-1"></i>${author.NumberOfTitlesSold} Titles</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += authorCard;
    });
}


///// ADMIN ACTIONS /////
// ========== CREATE AUTHOR ==========
function openCreateAuthorModal() {
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Name *</label>
            <input type="text" class="form-control" id="authorName" placeholder="Enter author name">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Biography</label>
            <textarea class="form-control" id="authorBio" rows="3" placeholder="Author biography"></textarea>
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Nationality</label>
            <input type="text" class="form-control" id="authorNat" placeholder="Author nationality">
        </div>
        <button class="btn btn-success w-100" onclick="createAuthorSubmit()">
            <i class="bi bi-check-circle me-1"></i>Create Author
        </button>
    `;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Create New Author';
    document.getElementById('authorDetails').innerHTML = html;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}

function createAuthorSubmit() {
    const name = document.getElementById('authorName').value.trim();
    if (!name) {
        Swal.fire('Error', 'Author name is required', 'error');
        return;
    }

    fetch("http://127.0.0.1:5000/api/admin/authors", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Name: name,
            Biography: document.getElementById('authorBio').value || null,
            Nationality: document.getElementById('authorNat').value || null
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success', 'Author created successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('authorModal')).hide();
            loadAllAuthors();
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to create author', 'error');
        });
}

// ========== EDIT AUTHOR ==========
function openEditAuthorModal() {
    if (allAuthors.length === 0) {
        Swal.fire('Info', 'No authors available', 'info');
        return;
    }

    const options = allAuthors.map(a => `<option value="${a.AuthorID}">${a.Name}</option>`).join('');
    
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Select Author *</label>
            <select class="form-select" id="selectAuthor" onchange="loadAuthorToEdit()">
                <option value="">-- Choose an author --</option>
                ${options}
            </select>
        </div>
        <div id="editForm" style="display: none;">
            <div class="mb-3">
                <label class="form-label fw-bold">Name *</label>
                <input type="text" class="form-control" id="editAuthorName">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Biography</label>
                <textarea class="form-control" id="editAuthorBio" rows="3"></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Nationality</label>
                <input type="text" class="form-control" id="editAuthorNat">
            </div>
            <button class="btn btn-warning w-100" onclick="editAuthorSubmit()">
                <i class="bi bi-pencil me-1"></i>Update Author
            </button>
        </div>
    `;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Author';
    document.getElementById('authorDetails').innerHTML = html;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}

function loadAuthorToEdit() {
    const id = document.getElementById('selectAuthor').value;
    if (!id) return;
    
    const author = allAuthors.find(a => a.AuthorID == id);
    if (!author) return;

    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editAuthorName').value = author.Name;
    document.getElementById('editAuthorBio').value = author.Biography || '';
    document.getElementById('editAuthorNat').value = author.Nationality || '';
}

function editAuthorSubmit() {
    const id = document.getElementById('selectAuthor').value;
    const name = document.getElementById('editAuthorName').value.trim();
    
    if (!name) {
        Swal.fire('Error', 'Author name is required', 'error');
        return;
    }

    fetch(`http://127.0.0.1:5000/api/admin/authors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Name: name,
            Biography: document.getElementById('editAuthorBio').value || null,
            Nationality: document.getElementById('editAuthorNat').value || null
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success', 'Author updated successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('authorModal')).hide();
            loadAllAuthors();
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to update author', 'error');
        });
}

// ========== DELETE AUTHOR ==========
function deleteAuthor() {
    if (allAuthors.length === 0) {
        Swal.fire('Info', 'No authors available', 'info');
        return;
    }

    const options = allAuthors.map(a => `<option value="${a.AuthorID}">${a.Name}</option>`).join('');
    
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Select Author *</label>
            <select class="form-select" id="deleteAuthorId">
                <option value="">-- Choose an author --</option>
                ${options}
            </select>
        </div>
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This action cannot be undone!
        </div>
        <button class="btn btn-danger w-100" onclick="deleteAuthorSubmit()">
            <i class="bi bi-trash me-1"></i>Delete Author
        </button>
    `;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-trash me-2"></i>Delete Author';
    document.getElementById('authorDetails').innerHTML = html;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}

function deleteAuthorSubmit() {
    const id = document.getElementById('deleteAuthorId').value;
    if (!id) {
        Swal.fire('Error', 'Please select an author', 'error');
        return;
    }

    Swal.fire({
        title: 'Confirm Delete?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`http://127.0.0.1:5000/api/admin/authors/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(r => r.json())
                .then(data => {
                    Swal.fire('Success', 'Author deleted successfully', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('authorModal')).hide();
                    loadAllAuthors();
                })
                .catch(e => {
                    console.error('Error:', e);
                    Swal.fire('Error', 'Failed to delete author', 'error');
                });
        }
    });
}