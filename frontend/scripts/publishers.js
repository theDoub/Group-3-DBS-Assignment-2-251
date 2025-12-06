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

document.addEventListener('DOMContentLoaded', function() {
    checkAdminRole();
    loadAllPublishers();
});

// Load all authors
function loadAllPublishers() {
    console.log("[loadAllPublishers] Fetching all publishers...");
    
    fetch("http://127.0.0.1:5000/api/authors/publishers")
        .then(res => res.json())
        .then(data => {
            console.log("Publishers data:", data);
            allAuthors = data;
            displayPublishers(data, 'allAuthorsContainer');
        })
        .catch(err => {
            console.error('Error loading publishers:', err);
            document.getElementById('allAuthorsContainer').innerHTML = '<div class="col-12 text-center text-danger py-5"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load publishers</div>';
        });
}

// Display publishers
function displayPublishers(publishers, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!publishers || publishers.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-inbox me-2"></i>No publishers found</div>';
        return;
    }

    publishers.forEach(publisher => {
        const initials = publisher.PublisherName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
        // Parse contacts array
        let contacts = [];
        if (publisher.Contacts) {
            if (typeof publisher.Contacts === 'string') {
                try {
                    contacts = JSON.parse(publisher.Contacts);
                } catch (e) {
                    console.warn("Failed to parse contacts:", e);
                }
            } else {
                contacts = Array.isArray(publisher.Contacts) ? publisher.Contacts : [];
            }
        }

        console.log("Publisher contacts:", contacts);
        
        const publisherCard = `
            <div class="col-md-6 col-lg-4">
                <div class="author-card" onclick="showPublisherDetails('${publisher.PublisherID}', '${publisher.PublisherName}', ${publisher.TotalBooksPublished || 0})" data-contacts='${JSON.stringify(contacts)}'>
                    <div class="author-card-header">
                        <div class="author-avatar">${initials}</div>
                        <h5 class="author-name">${publisher.PublisherName}</h5>
                    </div>
                    <div class="author-card-body">
                        <div class="author-info">
                            ${publisher.TotalBooksPublished ? `<span class="info-badge"><i class="bi bi-book me-1"></i>${publisher.TotalBooksPublished} Books</span>` : ''}
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

        container.innerHTML += publisherCard;
    });
}

// Show author details modal
function showPublisherDetails(publisherId, name, totalBooks) {
    console.log("[showPublisherDetails] Showing details for publisher ID:", publisherId);
    
    // Get contacts from data attribute of the clicked card
    const card = event.currentTarget.closest('.author-card');
    const contactsJson = card.getAttribute('data-contacts') || '[]';
    
    // Parse contacts from JSON string
    let contacts_detail = [];
    try {
        contacts_detail = JSON.parse(contactsJson);
    } catch (e) {
        console.warn("Failed to parse contacts:", e);
        contacts_detail = [];
    }

    // Filter out null contacts
    contacts_detail = contacts_detail.filter(c => c && (c.Email || c.PhoneNumber || c.Address));

    console.log("Publisher contacts for modal:", contacts_detail);

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
                    <h6 class="fw-bold mb-2"><i class="bi bi-calendar me-2" style="color: var(--primary);"></i>Contacts</h6>
                    ${contacts_detail.length === 0 ? '<p class="text-muted">No contact information available.</p>' : ''}
                    <ul class="list-group">
                        ${contacts_detail.map(contact => `
                            <li class="list-group-item">
                                ${contact.Email ? `<div><i class="bi bi-envelope-fill me-2" style="color: var(--primary);"></i>${contact.Email}</div>` : ''}
                                ${contact.PhoneNumber ? `<div><i class="bi bi-telephone-fill me-2" style="color: var(--primary);"></i>${contact.PhoneNumber}</div>` : ''}
                                ${contact.Address ? `<div><i class="bi bi-geo-alt-fill me-2" style="color: var(--primary);"></i>${contact.Address}</div>` : ''}
                            </li>
                        `).join('')}
                    </ul>   
                </div>
            </div>

            <div class="mb-4">
                <h6 class="fw-bold mb-2"><i class="bi bi-book me-2" style="color: var(--primary);"></i>Total Books</h6>
                <p class="badge bg-primary" style="font-size: 1rem; padding: 0.75rem 1.5rem;">${totalBooks} Books</p>
            </div>
        </div>
    `;

    document.getElementById('authorDetails').innerHTML = detailsHtml;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}


///// ADMIN ACTIONS /////
// ========== CREATE PUBLISHER ==========
function openCreatePublisherModal() {
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Name *</label>
            <input type="text" class="form-control" id="publisherName" placeholder="Enter publisher name">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Email</label>
            <input type="email" class="form-control" id="publisherEmail" placeholder="Contact email">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Phone Number</label>
            <input type="tel" class="form-control" id="publisherPhone" placeholder="Contact phone number">
        </div>
        <div class="mb-3">
            <label class="form-label fw-bold">Address</label>
            <input type="text" class="form-control" id="publisherAddress" placeholder="Contact address">
        </div>
        <button class="btn btn-success w-100" onclick="createPublisherSubmit()">
            <i class="bi bi-check-circle me-1"></i>Create Publisher
        </button>
    `;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Create New Publisher';
    document.getElementById('authorDetails').innerHTML = html;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}

function createPublisherSubmit() {
    const name = document.getElementById('publisherName').value.trim();
    if (!name) {
        Swal.fire('Error', 'Publisher name is required', 'error');
        return;
    }

    fetch("http://127.0.0.1:5000/api/admin/publishers", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Name: name,
            Email: document.getElementById('publisherEmail').value || null,
            PhoneNumber: document.getElementById('publisherPhone').value || null,
            Address: document.getElementById('publisherAddress').value || null
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success', 'Publisher created successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('authorModal')).hide();
            loadAllPublishers();
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to create publisher', 'error');
        });
}

// ========== EDIT PUBLISHER ==========
function openEditPublisherModal() {
    if (allAuthors.length === 0) {
        Swal.fire('Info', 'No publishers available', 'info');
        return;
    }

    const options = allAuthors.map(a => `<option value="${a.PublisherID}">${a.PublisherName}</option>`).join('');
    
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Select Publisher *</label>
            <select class="form-select" id="selectPublisher" onchange="loadPublisherToEdit()">
                <option value="">-- Choose a publisher --</option>
                ${options}
            </select>
        </div>
        <div id="editForm" style="display: none;">
            <div class="mb-3">
                <label class="form-label fw-bold">Name *</label>
                <input type="text" class="form-control" id="editPublisherName">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Email</label>
                <input type="email" class="form-control" id="editPublisherEmail">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Phone Number</label>
                <input type="tel" class="form-control" id="editPublisherPhone">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Address</label>
                <input type="text" class="form-control" id="editPublisherAddress">
            </div>
            <button class="btn btn-warning w-100" onclick="editPublisherSubmit()">
                <i class="bi bi-pencil me-1"></i>Update Publisher
            </button>
        </div>
    `;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Publisher';
    document.getElementById('authorDetails').innerHTML = html;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}

function loadPublisherToEdit() {
    const id = document.getElementById('selectPublisher').value;
    if (!id) return;
    
    const publisher = allAuthors.find(a => a.PublisherID == id);
    if (!publisher) return;

    document.getElementById('editForm').style.display = 'block';
    document.getElementById('editPublisherName').value = publisher.PublisherName;
    
    // Parse and fill contacts (use first contact if available)
    let contacts = [];
    if (publisher.Contacts) {
        if (typeof publisher.Contacts === 'string') {
            try {
                contacts = JSON.parse(publisher.Contacts);
            } catch (e) {
                console.warn("Failed to parse contacts:", e);
            }
        } else {
            contacts = Array.isArray(publisher.Contacts) ? publisher.Contacts : [];
        }
    }
    
    const firstContact = contacts.length > 0 ? contacts[0] : {};
    document.getElementById('editPublisherEmail').value = firstContact.Email || '';
    document.getElementById('editPublisherPhone').value = firstContact.PhoneNumber || '';
    document.getElementById('editPublisherAddress').value = firstContact.Address || '';
}

function editPublisherSubmit() {
    const id = document.getElementById('selectPublisher').value;
    const name = document.getElementById('editPublisherName').value.trim();
    
    if (!name) {
        Swal.fire('Error', 'Publisher name is required', 'error');
        return;
    }

    fetch(`http://127.0.0.1:5000/api/admin/publishers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Name: name,
            Email: document.getElementById('editPublisherEmail').value || null,
            PhoneNumber: document.getElementById('editPublisherPhone').value || null,
            Address: document.getElementById('editPublisherAddress').value || null
        })
    })
        .then(r => r.json())
        .then(data => {
            Swal.fire('Success', 'Publisher updated successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('authorModal')).hide();
            loadAllPublishers();
        })
        .catch(e => {
            console.error('Error:', e);
            Swal.fire('Error', 'Failed to update publisher', 'error');
        });
}

// ========== DELETE PUBLISHER ==========
function deletePublisher() {
    if (allAuthors.length === 0) {
        Swal.fire('Info', 'No publishers available', 'info');
        return;
    }

    const options = allAuthors.map(a => `<option value="${a.PublisherID}">${a.PublisherName}</option>`).join('');
    
    const html = `
        <div class="mb-3">
            <label class="form-label fw-bold">Select Publisher *</label>
            <select class="form-select" id="deletePublisherId">
                <option value="">-- Choose a publisher --</option>
                ${options}
            </select>
        </div>
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This action cannot be undone!
        </div>
        <button class="btn btn-danger w-100" onclick="deletePublisherSubmit()">
            <i class="bi bi-trash me-1"></i>Delete Publisher
        </button>
    `;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-trash me-2"></i>Delete Publisher';
    document.getElementById('authorDetails').innerHTML = html;
    new bootstrap.Modal(document.getElementById('authorModal')).show();
}

function deletePublisherSubmit() {
    const id = document.getElementById('deletePublisherId').value;
    if (!id) {
        Swal.fire('Error', 'Please select a publisher', 'error');
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
            fetch(`http://127.0.0.1:5000/api/admin/publishers/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(r => r.json())
                .then(data => {
                    Swal.fire('Success', 'Publisher deleted successfully', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('authorModal')).hide();
                    loadAllPublishers();
                })
                .catch(e => {
                    console.error('Error:', e);
                    Swal.fire('Error', 'Failed to delete publisher', 'error');
                });
        }
    });
}