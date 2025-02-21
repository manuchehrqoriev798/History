import { db } from './firebase-config.js';
import { ref, set, get, remove, query, orderByChild } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
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

// Create year element with inline edit functionality
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
            <div class="description-text">${yearData.description || ''}</div>
            <div class="edit-form" style="display: none;">
                <textarea class="edit-description">${yearData.description || ''}</textarea>
                <div class="edit-buttons">
                    <button class="save-edit-btn">Save</button>
                    <button class="cancel-edit-btn">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Add edit functionality
    const editBtn = yearDiv.querySelector('.edit-btn');
    const deleteBtn = yearDiv.querySelector('.delete-btn');
    const descriptionText = yearDiv.querySelector('.description-text');
    const editForm = yearDiv.querySelector('.edit-form');
    const editTextarea = yearDiv.querySelector('.edit-description');
    const saveEditBtn = yearDiv.querySelector('.save-edit-btn');
    const cancelEditBtn = yearDiv.querySelector('.cancel-edit-btn');

    editBtn.addEventListener('click', () => {
        descriptionText.style.display = 'none';
        editForm.style.display = 'block';
        editTextarea.value = yearData.description || '';
        editTextarea.focus();
    });

    cancelEditBtn.addEventListener('click', () => {
        descriptionText.style.display = 'block';
        editForm.style.display = 'none';
        editTextarea.value = yearData.description || '';
    });

    saveEditBtn.addEventListener('click', async () => {
        try {
            const yearRef = ref(db, 'years/' + yearId);
            const updatedData = {
                year: yearData.year,
                description: editTextarea.value,
                userName: yearData.userName || 'Admin'
            };
            await set(yearRef, updatedData);
            
            // Update the visible text and yearData
            descriptionText.innerHTML = editTextarea.value;
            yearData.description = editTextarea.value;
            
            // Hide edit form
            descriptionText.style.display = 'block';
            editForm.style.display = 'none';
            
            showNotification('Entry updated successfully');
        } catch (error) {
            console.error('Error editing year:', error);
            showNotification('Error updating entry', 'error');
        }
    });

    deleteBtn.addEventListener('click', () => {
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.innerHTML = `
            <div class="confirm-content">
                <p>Are you sure you want to delete this entry?</p>
                <div class="confirm-buttons">
                    <button class="confirm-yes">Yes, Delete</button>
                    <button class="confirm-no">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDialog);

        confirmDialog.querySelector('.confirm-yes').addEventListener('click', async () => {
            try {
                const yearRef = ref(db, 'years/' + yearId);
                await remove(yearRef);
                showNotification('Entry deleted successfully');
                loadYears();
            } catch (error) {
                console.error('Error deleting year:', error);
                showNotification('Error deleting entry', 'error');
            }
            confirmDialog.remove();
        });

        confirmDialog.querySelector('.confirm-no').addEventListener('click', () => {
            confirmDialog.remove();
        });
    });
    
    return yearDiv;
}

// Add year
document.getElementById('addYearForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const year = document.getElementById('yearInput').value;
    const description = document.getElementById('descriptionInput').value;
    
    try {
        const newYearRef = ref(db, 'years/' + Date.now());
        await set(newYearRef, {
            year: year,
            description: description,
            userName: 'admin'
        });
        
        document.getElementById('yearInput').value = '';
        document.getElementById('descriptionInput').value = '';
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