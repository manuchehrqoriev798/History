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

// Load user's entry with loading state
async function loadUserEntry() {
    showLoading(currentEntry);
    
    try {
        // Ensure user is authenticated
        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        const userEntryRef = ref(db, `userEntries/${auth.currentUser.uid}`);
        const snapshot = await get(userEntryRef);
        
        // Add a small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('yearInput').value = data.year;
            document.getElementById('descriptionInput').value = data.description;
            
            displayCurrentEntry(data);
        } else {
            currentEntry.innerHTML = `
                <div class="no-entries">
                    <p>No entry found. Create your first entry above!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading entry:', error);
        currentEntry.innerHTML = `
            <div class="error-message">
                <p>Error loading your entry. Please try again.</p>
            </div>
        `;
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

// Handle form submission
yearForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        const year = document.getElementById('yearInput').value;
        const description = document.getElementById('descriptionInput').value;
        
        const userEntryRef = ref(db, `userEntries/${auth.currentUser.uid}`);
        await set(userEntryRef, {
            year: year,
            description: description,
            userName: userName,
            userId: auth.currentUser.uid,
            timestamp: Date.now()
        });
        
        loadUserEntry();
        
        // Replace alert with a temporary success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Entry saved successfully!';
        yearForm.insertAdjacentElement('beforeend', successMessage);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    } catch (error) {
        console.error('Error saving entry:', error);
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Error saving entry. Please try again.';
        yearForm.insertAdjacentElement('beforeend', errorMessage);
        
        // Remove the error message after 3 seconds
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
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

// Add this line after your other initialization code
document.addEventListener('DOMContentLoaded', () => {
    initializeRichTextEditor('descriptionInput');
    // ... your existing initialization code ...
}); 