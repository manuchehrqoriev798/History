// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy, getDocs, get, ref, set } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js';

// Initialize Firebase
const firebaseConfig = {
    apiKey: '<API_KEY>',
    authDomain: '<AUTH_DOMAIN>',
    projectId: '<PROJECT_ID>',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const mainContent = document.getElementById('mainContent');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const yearsContainer = document.getElementById('yearsContainer');
const yearContent = document.getElementById('yearContent');
const yearsContent = document.getElementById('yearsContent');
const userControls = document.getElementById('userControls');
const addYearForm = document.getElementById('addYearForm');

// Sample historical data
const historicalData = {
    "2025": {
        title: "2025",
        content: "Our faculty continues to grow and innovate. We've introduced new programs in artificial intelligence and sustainable engineering, preparing our students for the challenges of tomorrow."
    },
    "2020": {
        title: "2020",
        content: "A pivotal year that saw our faculty adapt to global challenges. We successfully transitioned to remote learning while maintaining educational excellence. New research initiatives in healthcare technology were launched."
    },
    "2015": {
        title: "2015",
        content: "Marked the establishment of our Research Center for Innovation. The faculty received significant grants for research in renewable energy and smart cities technology."
    },
    "2010": {
        title: "2010",
        content: "Our faculty expanded with two new departments: Computer Science and Environmental Engineering. Student enrollment reached record numbers, and we established partnerships with leading industry players."
    },
    "2005": {
        title: "2005",
        content: "The foundation year of our modern engineering programs. We began with three core departments and a vision to become a leading institution in technical education."
    }
};

// Firebase login credentials
const ADMIN_EMAIL = 'admin@faculty.com';
const USER_EMAIL = 'user@faculty.com';

// Login functionality
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Determine which type of login to attempt based on password
    let emailToUse;
    if (password === 'admin123') {
        emailToUse = ADMIN_EMAIL;
        sessionStorage.setItem('userType', 'admin');
    } else if (password === 'user123') {
        emailToUse = USER_EMAIL;
        sessionStorage.setItem('userType', 'user');
    } else {
        loginError.textContent = 'Invalid password. Please try again.';
        return;
    }

    try {
        // Attempt Firebase authentication
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        loginSuccess(username);
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Invalid password. Please try again.';
    }
});

// Logout functionality
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

function loginSuccess(username) {
    loginSection.style.display = 'none';
    mainContent.style.display = 'block';
    loginError.textContent = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    sessionStorage.setItem('username', username);
    initializePage();
}

function logout() {
    loginSection.style.display = 'flex';
    mainContent.style.display = 'none';
    yearsContainer.innerHTML = '';
    yearContent.innerHTML = '<div class="content-placeholder">Select a year to view its history</div>';
    yearsContent.innerHTML = '';
    sessionStorage.clear();
}

// Create year buttons
function createYearButtons() {
    // Sort years in descending order
    const years = Object.keys(historicalData).sort((a, b) => b - a);
    
    years.forEach(year => {
        const button = document.createElement('button');
        button.classList.add('year-button');
        button.textContent = year;
        button.addEventListener('click', () => showYearContent(year));
        yearsContainer.appendChild(button);
    });
}

// Show content for selected year
function showYearContent(year) {
    // Remove active class from all buttons
    document.querySelectorAll('.year-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected button
    const selectedButton = Array.from(document.querySelectorAll('.year-button'))
        .find(btn => btn.textContent === year);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // Update content
    const yearData = historicalData[year];
    yearContent.innerHTML = `
        <div class="year-info">
            <h2>${yearData.title}</h2>
            <p>${yearData.content}</p>
        </div>
    `;
}

// Load years data from Firebase
async function loadYears() {
    try {
        const yearsRef = collection(db, 'years');
        const q = query(yearsRef, orderBy('year', 'desc'));
        const querySnapshot = await getDocs(q);
        
        yearsContent.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const yearData = doc.data();
            const yearElement = createYearElement(doc.id, yearData);
            yearsContent.appendChild(yearElement);
        });
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

// Create year element
function createYearElement(docId, yearData) {
    const yearDiv = document.createElement('div');
    yearDiv.className = 'year-card';
    
    const yearHeader = document.createElement('div');
    yearHeader.className = 'year-header';
    
    const yearTitle = document.createElement('h2');
    yearTitle.textContent = yearData.year;
    
    const controls = document.createElement('div');
    controls.className = 'controls';
    
    if (sessionStorage.getItem('userType') === 'admin') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteYear(docId);
        controls.appendChild(deleteBtn);
    }
    
    yearHeader.appendChild(yearTitle);
    yearHeader.appendChild(controls);
    
    const yearInfo = document.createElement('p');
    yearInfo.textContent = yearData.info;
    
    yearDiv.appendChild(yearHeader);
    yearDiv.appendChild(yearInfo);
    
    return yearDiv;
}

// Add new year
addYearForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const yearInput = document.getElementById('yearInput');
    const infoInput = document.getElementById('infoInput');
    
    try {
        await addYear(yearInput.value, infoInput.value);
        yearInput.value = '';
        infoInput.value = '';
    } catch (error) {
        console.error('Error adding year:', error);
    }
});

async function addYear(year, info) {
    try {
        const yearsRef = collection(db, 'years');
        await addDoc(yearsRef, {
            year: parseInt(year),
            info: info
        });
        loadYears();
    } catch (error) {
        console.error('Error adding year:', error);
    }
}

// Delete year (admin only)
async function deleteYear(docId) {
    if (sessionStorage.getItem('userType') !== 'admin') return;
    
    if (confirm('Are you sure you want to delete this year?')) {
        try {
            // Get the year data first to find associated userEntry
            const yearRef = doc(db, 'years', docId);
            const yearSnapshot = await get(yearRef);
            
            if (yearSnapshot.exists()) {
                const yearData = yearSnapshot.data();
                const userId = yearData.userId;

                // Delete from years collection
                await deleteDoc(yearRef);

                // If there's an associated userId, delete from userEntries
                if (userId) {
                    const userEntryRef = ref(db, `users/${userId}/entries`);
                    await set(userEntryRef, null);
                }

                // Also delete from userEntries collection if it exists
                const userEntriesRef = ref(db, `userEntries/${userId}`);
                await set(userEntriesRef, null);

                loadYears();
                showNotification('Entry deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting year:', error);
            showNotification('Error deleting entry', 'error');
        }
    }
}

// Initialize the page
function initializePage() {
    createYearButtons();
    loadYears();
    
    // Show the most recent year by default
    const mostRecentYear = Object.keys(historicalData)
        .sort((a, b) => b - a)[0];
    showYearContent(mostRecentYear);
}

// Check if user is already logged in when page loads
auth.onAuthStateChanged((user) => {
    const savedUsername = sessionStorage.getItem('username');
    if (user && savedUsername) {
        loginSuccess(savedUsername);
    } else {
        loginSection.style.display = 'flex';
        mainContent.style.display = 'none';
    }
});
