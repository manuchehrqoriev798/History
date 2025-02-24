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

        // Get user's personal entry from their specific path
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
            
            // Clear the form and editable div
            document.getElementById('yearInput').value = '';
            const descriptionInput = document.getElementById('descriptionInput');
            descriptionInput.value = '';
            const editableDiv = descriptionInput.previousSibling;
            if (editableDiv && editableDiv.className === 'editable-content') {
                editableDiv.innerHTML = '';
            }
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
        const timestamp = new Date().toISOString();
        
        // Save to user's personal entries
        const userEntryRef = ref(db, `users/${uid}/entries`);
        await set(userEntryRef, {
            year,
            description,
            timestamp,
            userName
        });

        // Update or create entry in userEntries collection
        const userEntriesRef = ref(db, `userEntries/${uid}`);
        await set(userEntriesRef, {
            year,
            description,
            timestamp,
            userName,
            userId: uid
        });

        // Check if entry exists in years collection
        const yearsRef = ref(db, 'years');
        const yearsSnapshot = await get(yearsRef);
        let existingYearKey = null;

        if (yearsSnapshot.exists()) {
            yearsSnapshot.forEach((yearSnapshot) => {
                const yearData = yearSnapshot.val();
                if (yearData.userId === uid) {
                    existingYearKey = yearSnapshot.key;
                }
            });
        }

        // Update or create entry in years collection
        const yearRef = ref(db, `years/${existingYearKey || Date.now()}`);
        await set(yearRef, {
            year,
            description,
            userName,
            userId: uid,
            timestamp
        });

        // Update the current entry display
        displayCurrentEntry({
            year,
            description
        });

        // Store in localStorage
        localStorage.setItem(`editor_${uid}_descriptionInput`, description);
        
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
document.addEventListener('DOMContentLoaded', () => {
    initializeRichTextEditor('descriptionInput');
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Load the user's personal entry
            loadUserEntry();
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Modify the loadYears function to prevent duplicates
async function loadYears() {
    const yearsList = document.getElementById('yearsList');
    showLoading(yearsList);
    
    try {
        const yearsRef = ref(db, 'years');
        const yearsQuery = query(yearsRef, orderByChild('year'));
        const snapshot = await get(yearsQuery);
        
        yearsList.innerHTML = '';
        
        if (snapshot.exists()) {
            // Create a map to store unique entries by year
            const uniqueYears = new Map();
            
            snapshot.forEach((childSnapshot) => {
                const yearData = childSnapshot.val();
                const year = yearData.year;
                
                // Only keep the most recent entry for each year
                if (!uniqueYears.has(year) || 
                    yearData.timestamp > uniqueYears.get(year).timestamp) {
                    uniqueYears.set(year, {
                        id: childSnapshot.key,
                        ...yearData
                    });
                }
            });
            
            // Convert map to array and sort by year
            const yearsArray = Array.from(uniqueYears.values())
                .sort((a, b) => b.year - a.year);
            
            yearsArray.forEach((yearData, index) => {
                const yearElement = createYearElement(yearData.id, yearData);
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

// Modify the addYear function to include a timestamp
async function addYear(year, description) {
    try {
        const newYearRef = ref(db, 'years/' + Date.now());
        await set(newYearRef, {
            year: year,
            description: description,
            userName: sessionStorage.getItem('userName'),
            timestamp: Date.now() // Add timestamp
        });
        
        showNotification('Entry added successfully');
        loadYears();
    } catch (error) {
        console.error('Error adding year:', error);
        showNotification('Error adding entry', 'error');
    }
} 