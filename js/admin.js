import { db } from './firebase-config.js';
import { ref, set, get, remove, query, orderByChild } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';

// Check if user is logged in as admin
if (!sessionStorage.getItem('userName') || sessionStorage.getItem('userRole') !== 'admin') {
    window.location.href = 'login.html';
}

// Load years
async function loadYears() {
    const yearsList = document.getElementById('yearsList');
    yearsList.innerHTML = '';
    
    try {
        const yearsRef = ref(db, 'years');
        const yearsQuery = query(yearsRef, orderByChild('year'));
        const snapshot = await get(yearsQuery);
        
        if (snapshot.exists()) {
            // Convert to array and sort by year in descending order
            const yearsArray = [];
            snapshot.forEach((childSnapshot) => {
                yearsArray.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            yearsArray.sort((a, b) => b.year - a.year);
            
            yearsArray.forEach((yearData) => {
                const yearElement = createYearElement(yearData.id, yearData);
                yearsList.appendChild(yearElement);
            });
        }
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

// Create year element
function createYearElement(yearId, yearData) {
    const yearDiv = document.createElement('div');
    yearDiv.className = 'year-item';
    
    yearDiv.innerHTML = `
        <div class="year-header">
            <h3>${yearData.year}</h3>
            <div class="year-controls">
                <button class="edit-btn" onclick="editYear('${yearId}', ${yearData.year}, '${yearData.description}')">Edit</button>
                <button class="delete-btn" onclick="deleteYear('${yearId}')">Delete</button>
            </div>
        </div>
        <p class="year-author">Added by: ${yearData.userName || 'Admin'}</p>
        <p>${yearData.description}</p>
    `;
    
    return yearDiv;
}

// Add year
document.getElementById('addYearForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const year = document.getElementById('yearInput').value;
    const description = document.getElementById('descriptionInput').value;
    
    try {
        const newYearRef = ref(db, 'years/' + Date.now()); // Using timestamp as unique ID
        await set(newYearRef, {
            year: parseInt(year),
            description: description
        });
        
        document.getElementById('yearInput').value = '';
        document.getElementById('descriptionInput').value = '';
        loadYears();
    } catch (error) {
        console.error('Error adding year:', error);
    }
});

// Delete year
window.deleteYear = async (yearId) => {
    if (confirm('Are you sure you want to delete this year?')) {
        try {
            const yearRef = ref(db, 'years/' + yearId);
            await remove(yearRef);
            loadYears();
        } catch (error) {
            console.error('Error deleting year:', error);
        }
    }
};

// Add edit functionality
window.editYear = async (yearId, year, description) => {
    const newDescription = prompt('Edit description:', description);
    if (newDescription !== null) {
        try {
            const yearRef = ref(db, 'years/' + yearId);
            await set(yearRef, {
                year: year,
                description: newDescription,
                userName: 'admin'
            });
            loadYears();
        } catch (error) {
            console.error('Error editing year:', error);
        }
    }
};

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
});

// Initialize
loadYears(); 