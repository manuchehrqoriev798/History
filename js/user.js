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

// Show notification function with improved styling
function showNotification(message, type = 'success') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;

    // Add success icon for success message
    const icon = type === 'success' ? '✓' : '!';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px; font-weight: bold;">${icon}</span>
            <p style="margin: 0; font-size: 16px;">${message}</p>
        </div>
        <button class="notification-close" style="
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0 5px;
            margin-left: 15px;
        ">&times;</button>
    `;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 3000);
    }, 3000);
}

// Show loading spinner
function showLoading(element) {
    element.innerHTML = `
        <div class="loading-spinner">
            <div class="loading-text">Loading your entry...</div>
        </div>
    `;
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

// Update the form submission handler to use the new notification
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
        // Save to user's personal entries
        const userEntryRef = ref(db, `users/${uid}/entries`);
        await set(userEntryRef, {
            year: year,
            description: description,
            userName: userName,
            lastUpdated: new Date().toISOString()
        });

        // Also save to years collection for public display
        const yearRef = ref(db, `years/${Date.now()}`);
        await set(yearRef, {
            year: year,
            description: description,
            userName: userName,
            lastUpdated: new Date().toISOString()
        });

        // Also save to userEntries for public display
        const publicEntryRef = ref(db, `userEntries/${uid}`);
        await set(publicEntryRef, {
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
        
        showNotification('Entry saved successfully! 🎉');
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