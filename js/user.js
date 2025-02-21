import { db, auth } from './firebase-config.js';
import { ref, get, set, query, orderByChild } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';
import { initializeRichTextEditor } from './richTextEditor.js';

// Check if user is logged in
if (!sessionStorage.getItem('userName')) {
    window.location.href = 'login.html';
}

const userName = sessionStorage.getItem('userName');
const yearForm = document.getElementById('yearForm');
const currentEntry = document.getElementById('currentEntry');

// Show loading spinner
function showLoading(element) {
    element.innerHTML = `
        <div class="loading-spinner">
            <div class="loading-text">Loading your entry...</div>
        </div>
    `;
}

// Add notification function
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

// Load user's current entry when page loads
async function loadUserEntry() {
    try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const userEntryRef = ref(db, `users/${uid}/entries`);
        const snapshot = await get(userEntryRef);

        if (snapshot.exists()) {
            const entryData = snapshot.val();
            // Fill in the form with existing data
            document.getElementById('yearInput').value = entryData.year;
            const descriptionInput = document.getElementById('descriptionInput');
            descriptionInput.value = entryData.description;
            
            // Update the editable div content
            const editableDiv = descriptionInput.previousSibling;
            if (editableDiv && editableDiv.className === 'editable-content') {
                editableDiv.innerHTML = entryData.description;
            }
            
            // Update the current entry display
            currentEntry.innerHTML = `
                <h3>Your Current Entry</h3>
                <div class="entry-content">
                    <p><strong>Year:</strong> ${entryData.year}</p>
                    <div class="description-content">${entryData.description}</div>
                </div>
            `;
        } else {
            currentEntry.innerHTML = `
                <h3>Your Entry</h3>
                <p class="no-entry-message">You haven't created an entry yet. Use the form above to add your historical entry.</p>
            `;
        }
    } catch (error) {
        console.error('Error loading user entry:', error);
        showNotification('Error loading your entry', 'error');
    }
}

// Display current entry with animation
function displayCurrentEntry(data) {
    currentEntry.innerHTML = `
        <div class="entry-content content-loading">
            <h3>Your Current Entry</h3>
            <div class="entry-details">
                <p><strong>Year:</strong> ${data.year}</p>
                <p><strong>Description:</strong> ${data.description}</p>
            </div>
        </div>
    `;
}

// Update the form submission handler
document.getElementById('yearForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const year = document.getElementById('yearInput').value;
    const descriptionInput = document.getElementById('descriptionInput');
    const description = descriptionInput.value;
    const userName = sessionStorage.getItem('userName');
    const uid = auth.currentUser?.uid;
    
    if (!uid) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const userEntryRef = ref(db, `users/${uid}/entries`);
        await set(userEntryRef, {
            year: year,
            description: description,
            userName: userName,
            lastUpdated: new Date().toISOString()
        });
        
        // Update the editable div content after successful save
        const editableDiv = descriptionInput.previousSibling;
        if (editableDiv && editableDiv.className === 'editable-content') {
            editableDiv.innerHTML = description;
        }
        
        // Update the current entry display
        currentEntry.innerHTML = `
            <h3>Your Current Entry</h3>
            <div class="entry-content">
                <p><strong>Year:</strong> ${year}</p>
                <div class="description-content">${description}</div>
            </div>
        `;
        
        // Store in localStorage
        localStorage.setItem(`editor_descriptionInput`, description);
        
        showNotification('Entry saved successfully');
    } catch (error) {
        console.error('Error saving entry:', error);
        showNotification('Error saving entry', 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Initialize
auth.onAuthStateChanged((user) => {
    if (user) {
        loadUserEntry();
    } else {
        window.location.href = 'login.html';
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initializeRichTextEditor('descriptionInput');
    loadUserEntry(); // Add this line to load the user's entry when page loads
}); 