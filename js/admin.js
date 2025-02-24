import { db } from './firebase-config.js';
import { ref, set, get, remove, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
import { initializeRichTextEditor } from './richTextEditor.js';

// Check if user is logged in as admin
if (!sessionStorage.getItem('userName') || sessionStorage.getItem('userRole') !== 'admin') {
    window.location.href = 'login.html';
}

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <p>${message}</p>
            <button class="notification-close">&times;</button>
        </div>
    `;
    document.body.appendChild(notification);

    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add loading spinner function
function showLoading(element) {
    element.innerHTML = `
        <div class="loading-spinner">
            <div class="loading-text">Loading historical entries...</div>
        </div>
    `;
}

// Load years with loading state
async function loadYears() {
    const yearsList = document.getElementById('yearsList');
    showLoading(yearsList);
    
    try {
        const yearsRef = ref(db, 'years');
        const yearsQuery = query(yearsRef, orderByChild('year'));
        const snapshot = await get(yearsQuery);
        
        // Add a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        
        yearsList.innerHTML = '';
        
        if (snapshot.exists()) {
            const yearsArray = [];
            snapshot.forEach((childSnapshot) => {
                yearsArray.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            yearsArray.sort((a, b) => b.year - a.year);
            
            yearsArray.forEach((yearData, index) => {
                const yearElement = createYearElement(yearData.id, yearData);
                // Add staggered animation delay
                yearElement.style.animation = `fadeIn 0.3s ease-out ${index * 0.1}s`;
                yearElement.style.opacity = '0';
                yearElement.style.animationFillMode = 'forwards';
                yearsList.appendChild(yearElement);
            });
        } else {
            yearsList.innerHTML = '<p class="no-entries">No historical entries found.</p>';
        }
    } catch (error) {
        console.error('Error loading years:', error);
        showNotification('Error loading years', 'error');
        yearsList.innerHTML = '<p class="error-message">Error loading entries. Please try again.</p>';
    }
}

// Custom confirm dialog function
function showConfirmDialog(message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content paper-effect">
                <h3>Confirm Deletion</h3>
                <p>${message}</p>
                <div class="confirm-buttons">
                    <button class="confirm-yes">Yes, Delete</button>
                    <button class="confirm-no">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const yesBtn = dialog.querySelector('.confirm-yes');
        const noBtn = dialog.querySelector('.confirm-no');

        yesBtn.addEventListener('click', () => {
            dialog.remove();
            resolve(true);
        });

        noBtn.addEventListener('click', () => {
            dialog.remove();
            resolve(false);
        });

        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
                resolve(false);
            }
        });
    });
}

// Updated deleteYear function with better confirmation
async function deleteYear(yearId) {
    if (sessionStorage.getItem('userRole') !== 'admin') {
        showNotification('Unauthorized: Admin privileges required', 'error');
        return;
    }
    
    const confirmed = await showConfirmDialog('Are you sure you want to delete this historical entry? This action cannot be undone.');
    
    if (!confirmed) return;

    try {
        // Get the year data first to find associated user
        const yearRef = ref(db, `years/${yearId}`);
        const yearSnapshot = await get(yearRef);
        
        if (!yearSnapshot.exists()) {
            showNotification('Entry not found', 'error');
            return;
        }

        const yearData = yearSnapshot.val();
        const userId = yearData.userId;

        if (!userId) {
            // If no userId, just delete from years collection
            await remove(yearRef);
            showNotification('Entry deleted from years collection');
            await loadYears();
            return;
        }

        // Check if entry exists in userEntries
        const userEntryRef = ref(db, `userEntries/${userId}`);
        const userEntrySnapshot = await get(userEntryRef);

        const deletionPromises = [];

        // Delete from years collection
        deletionPromises.push(remove(yearRef));

        // Delete from userEntries if it exists
        if (userEntrySnapshot.exists()) {
            deletionPromises.push(remove(userEntryRef));
        }

        // Delete from user's personal entries if they exist
        const userPersonalEntryRef = ref(db, `users/${userId}/entries`);
        const personalEntrySnapshot = await get(userPersonalEntryRef);
        if (personalEntrySnapshot.exists()) {
            deletionPromises.push(remove(userPersonalEntryRef));
        }

        // Execute all deletions
        await Promise.all(deletionPromises);
        
        showNotification(`Entry successfully deleted from all collections`);
        
        // Refresh the views
        await loadYears();

    } catch (error) {
        console.error('Error deleting entry:', error);
        showNotification('Error deleting entry: ' + error.message, 'error');
    }
}

// Add year
document.getElementById('addYearForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const yearInput = document.getElementById('yearInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const editableDiv = descriptionInput.previousSibling;
    
    try {
        const newYearRef = ref(db, 'years/' + Date.now());
        await set(newYearRef, {
            year: yearInput.value,
            description: descriptionInput.value,
            userName: 'admin'
        });
        
        // Clear both the textarea and editable div
        yearInput.value = '';
        descriptionInput.value = '';
        editableDiv.innerHTML = '';
        
        showNotification('Entry added successfully');
        loadYears();
    } catch (error) {
        console.error('Error adding year:', error);
        showNotification('Error adding entry', 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeRichTextEditor('descriptionInput');
    loadYears();
});

// Update the deleteUser function to handle all user data
async function deleteUser(userId) {
    if (sessionStorage.getItem('userRole') !== 'admin') {
        showNotification('Unauthorized: Admin privileges required', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this user and all their entries?')) {
        return;
    }

    try {
        const deletionPromises = [];

        // 1. Get all user's entries from years collection
        const yearsRef = ref(db, 'years');
        const yearsQuery = query(yearsRef, orderByChild('userId'), equalTo(userId));
        const yearsSnapshot = await get(yearsQuery);

        if (yearsSnapshot.exists()) {
            yearsSnapshot.forEach((yearSnapshot) => {
                // Delete from years
                const yearRef = ref(db, `years/${yearSnapshot.key}`);
                deletionPromises.push(remove(yearRef));
                
                // Delete corresponding entry from userEntries
                const userEntryRef = ref(db, `userEntries/${yearSnapshot.key}`);
                deletionPromises.push(remove(userEntryRef));
            });
        }

        // 2. Delete user's personal entries
        const userPersonalEntriesRef = ref(db, `users/${userId}/entries`);
        deletionPromises.push(remove(userPersonalEntriesRef));

        // 3. Delete the user account itself
        const userRef = ref(db, `users/${userId}`);
        deletionPromises.push(remove(userRef));

        // Execute all deletions
        await Promise.all(deletionPromises);

        showNotification('User and all associated entries deleted successfully');
        
        // Refresh all relevant views
        await Promise.all([
            loadYears(),
            typeof loadUsers === 'function' ? loadUsers() : Promise.resolve()
        ]);

    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user: ' + error.message, 'error');
    }
}

// Helper function to create year element
function createYearElement(yearId, yearData) {
    const yearDiv = document.createElement('div');
    yearDiv.className = 'year-item content-loading';
    
    yearDiv.innerHTML = `
        <div class="year-header">
            <h3>${yearData.year}</h3>
            <div class="year-controls">
                <button class="edit-btn" data-id="${yearId}">Edit</button>
                <button class="delete-btn" data-id="${yearId}">Delete</button>
            </div>
        </div>
        <p class="year-author">Added by: ${yearData.userName || 'Admin'}</p>
        <div class="year-content">
            <p class="description-text">${yearData.description}</p>
            <div class="edit-form" style="display: none;">
                <textarea class="edit-description">${yearData.description}</textarea>
                <div class="edit-buttons">
                    <button class="save-edit-btn">Save</button>
                    <button class="cancel-edit-btn">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Add delete functionality
    const deleteBtn = yearDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteYear(yearId));

    // Add edit functionality
    const editBtn = yearDiv.querySelector('.edit-btn');
    const descriptionText = yearDiv.querySelector('.description-text');
    const editForm = yearDiv.querySelector('.edit-form');
    const editTextarea = yearDiv.querySelector('.edit-description');
    const saveEditBtn = yearDiv.querySelector('.save-edit-btn');
    const cancelEditBtn = yearDiv.querySelector('.cancel-edit-btn');

    editBtn.addEventListener('click', () => {
        descriptionText.style.display = 'none';
        editForm.style.display = 'block';
        editTextarea.value = yearData.description;
        const editableDiv = editTextarea.previousSibling;
        editableDiv.innerHTML = yearData.description;
        editTextarea.focus();
    });

    cancelEditBtn.addEventListener('click', () => {
        descriptionText.style.display = 'block';
        editForm.style.display = 'none';
        editTextarea.value = yearData.description;
    });

    saveEditBtn.addEventListener('click', async () => {
        try {
            const yearRef = ref(db, 'years/' + yearId);
            await set(yearRef, {
                year: yearData.year,
                description: editTextarea.value,
                userName: 'admin'
            });
            showNotification('Entry updated successfully');
            loadYears();
        } catch (error) {
            console.error('Error editing year:', error);
            showNotification('Error updating entry', 'error');
        }
    });
    
    return yearDiv;
} 