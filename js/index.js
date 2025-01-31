import { db } from './firebase-config.js';
import { ref, get, query, orderByChild } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';

// DOM Elements
const yearsList = document.getElementById('yearsList');
const yearContent = document.getElementById('yearContent');

// Check if user is logged in
const userRole = sessionStorage.getItem('userRole');

// Load all years from both users and admin
async function loadYears() {
    yearsList.innerHTML = '';
    
    try {
        // Get years from the public years collection
        const yearsRef = ref(db, 'years');
        const yearsQuery = query(yearsRef, orderByChild('year'));
        const snapshot = await get(yearsQuery);
        
        // Get years from user entries
        const userEntriesRef = ref(db, 'userEntries');
        const userEntriesSnapshot = await get(userEntriesRef);
        
        const yearsArray = [];
        
        // Add years from public collection
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                yearsArray.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        
        // Add years from user entries
        if (userEntriesSnapshot.exists()) {
            userEntriesSnapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                // Only add if it's not already in the array
                if (!yearsArray.some(entry => entry.year === userData.year)) {
                    yearsArray.push({
                        id: childSnapshot.key,
                        ...userData
                    });
                }
            });
        }
        
        if (yearsArray.length > 0) {
            // Sort years in descending order
            yearsArray.sort((a, b) => b.year - a.year);
            
            // Create buttons for each year
            yearsArray.forEach((yearData) => {
                const yearButton = createYearButton(yearData);
                yearsList.appendChild(yearButton);
            });

            // Show first year's content by default
            showYearContent(yearsArray[0]);
        } else {
            yearContent.innerHTML = `
                <div class="content-placeholder paper-effect">
                    <h3>Welcome to Faculty History</h3>
                    <p>Historical entries will appear here once they are added.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading years:', error);
        yearContent.innerHTML = `
            <div class="content-placeholder paper-effect">
                <p>Error loading historical entries. Please try again later.</p>
            </div>
        `;
    }
}

// Create year button
function createYearButton(yearData) {
    const button = document.createElement('button');
    button.className = 'year-button';
    button.textContent = yearData.year;
    button.addEventListener('click', () => showYearContent(yearData));
    return button;
}

// Show year content
function showYearContent(yearData) {
    // Remove active class from all buttons
    document.querySelectorAll('.year-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const buttons = document.querySelectorAll('.year-button');
    buttons.forEach(btn => {
        if (btn.textContent === yearData.year.toString()) {
            btn.classList.add('active');
        }
    });

    // Update content with historical styling
    yearContent.innerHTML = `
        <div class="year-info paper-effect">
            <h2 class="decorative-border">${yearData.year}</h2>
            <p class="historical-text">${yearData.description}</p>
            <p class="entry-author">Contributed by: ${yearData.userName || 'Admin'}</p>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadYears();
}); 