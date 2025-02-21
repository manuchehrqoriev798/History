import { db } from './firebase-config.js';
import { ref, get, query, orderByChild } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';

// DOM Elements
const yearsList = document.getElementById('yearsList');
const yearContent = document.getElementById('yearContent');
const timelineContainer = document.getElementById('timeline');

// Check if user is logged in
const userRole = sessionStorage.getItem('userRole');

// Modify loadTimeline function to remove loading state
async function loadTimeline() {
    try {
        const yearsRef = ref(db, 'years');
        const yearsQuery = query(yearsRef, orderByChild('year'));
        const snapshot = await get(yearsQuery);
        
        // Add a small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (snapshot.exists()) {
            const yearsArray = [];
            snapshot.forEach((childSnapshot) => {
                yearsArray.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Sort years in descending order
            yearsArray.sort((a, b) => b.year - a.year);
            
            // Clear container and create wrapper for timeline entries
            timelineContainer.innerHTML = '<div class="timeline-entries"></div>';
            const entriesWrapper = timelineContainer.querySelector('.timeline-entries');
            
            // Create timeline entries with staggered animation
            yearsArray.forEach((yearData, index) => {
                const timelineEntry = document.createElement('div');
                timelineEntry.className = 'timeline-entry';
                timelineEntry.style.animation = `slideUpFade 0.5s ease-out ${index * 0.1}s forwards`;
                timelineEntry.style.opacity = '0';
                
                timelineEntry.innerHTML = `
                    <div class="timeline-content paper-effect">
                        <div class="year-marker">${yearData.year}</div>
                        <div class="entry-content">
                            <p class="entry-author">Added by: ${yearData.userName || 'Anonymous'}</p>
                            <p class="entry-description">${yearData.description}</p>
                        </div>
                    </div>
                `;
                
                entriesWrapper.appendChild(timelineEntry);
            });
        } else {
            timelineContainer.innerHTML = `
                <div class="no-entries">
                    <p>No historical entries found.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading timeline:', error);
        timelineContainer.innerHTML = `
            <div class="error-message">
                <p>Error loading timeline. Please try again.</p>
            </div>
        `;
    }
}

// Load all years from both users and admin
async function loadYears() {
    yearsList.innerHTML = '';
    
    try {
        // Fetch both collections in parallel
        const [yearsSnapshot, userEntriesSnapshot] = await Promise.all([
            get(query(ref(db, 'years'), orderByChild('year'))),
            get(ref(db, 'userEntries'))
        ]);
        
        const yearsArray = [];
        const seenYears = new Set(); // Track unique year entries
        
        // Process public years
        if (yearsSnapshot.exists()) {
            yearsSnapshot.forEach((childSnapshot) => {
                const yearData = childSnapshot.val();
                const yearKey = `${yearData.year}-${yearData.userName}`; // Create unique key
                if (!seenYears.has(yearKey)) {
                    seenYears.add(yearKey);
                    yearsArray.push({
                        id: childSnapshot.key,
                        ...yearData
                    });
                }
            });
        }
        
        // Process user entries
        if (userEntriesSnapshot.exists()) {
            userEntriesSnapshot.forEach((userSnapshot) => {
                const userData = userSnapshot.val();
                if (userData.year && userData.description) {
                    const yearKey = `${userData.year}-${userData.userName}`;
                    if (!seenYears.has(yearKey)) {
                        seenYears.add(yearKey);
                        yearsArray.push({
                            id: userSnapshot.key,
                            ...userData
                        });
                    }
                }
            });
        }
        
        if (yearsArray.length > 0) {
            // Sort years in descending order
            yearsArray.sort((a, b) => b.year - a.year);
            
            // Immediately show first year
            const firstYear = yearsArray[0];
            const firstYearButton = createYearButton(firstYear);
            yearsList.appendChild(firstYearButton);
            
            // Show content without artificial delay
            showYearContent(firstYear);

            // Use requestAnimationFrame for smoother rendering of remaining years
            requestAnimationFrame(() => {
                const fragment = document.createDocumentFragment();
                yearsArray.slice(1).forEach(yearData => {
                    fragment.appendChild(createYearButton(yearData));
                });
                yearsList.appendChild(fragment);
            });

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

// Show year content without artificial delays
function showYearContent(yearData) {
    document.querySelectorAll('.year-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === yearData.year.toString()) {
            btn.classList.add('active');
        }
    });

    yearContent.innerHTML = `
        <div class="year-info paper-effect">
            <h2 class="decorative-border">${yearData.year}</h2>
            <p class="historical-text">${yearData.description}</p>
            <p class="entry-author">Contributed by: ${yearData.userName || 'Admin'}</p>
        </div>
    `;
}

// Initialize without artificial delay
document.addEventListener('DOMContentLoaded', () => {
    loadYears();
}); 