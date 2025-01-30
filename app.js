document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminControls = document.getElementById('admin-controls');
    const yearsList = document.getElementById('years-list');

    // Show admin controls if admin is logged in
    if (isAdmin) {
        adminControls.style.display = 'block';
    }

    // Fetch and display years
    db.collection('years').orderBy('year').get().then((querySnapshot) => {
        yearsList.innerHTML = ''; // Clear existing content
        querySnapshot.forEach((doc) => {
            const yearData = doc.data();
            const yearElement = document.createElement('div');
            yearElement.classList.add('year-item');
            yearElement.innerHTML = `
                <h3>${yearData.year}</h3>
                <p>${yearData.information}</p>
                ${isAdmin ? `<button onclick="deleteYear('${doc.id}')">Delete</button>` : ''}
            `;
            yearsList.appendChild(yearElement);
        });
    });
});

function addYear() {
    const yearInput = document.getElementById('yearInput');
    const infoInput = document.getElementById('infoInput');
    
    if (yearInput.value && infoInput.value) {
        db.collection('years').add({
            year: yearInput.value,
            information: infoInput.value
        }).then(() => {
            yearInput.value = '';
            infoInput.value = '';
            location.reload(); // Refresh to show new year
        });
    }
}

function deleteYear(docId) {
    db.collection('years').doc(docId).delete().then(() => {
        location.reload(); // Refresh to remove deleted year
    });
}

// Logout function
function logout() {
    localStorage.removeItem('isAdmin');
    window.location.href = 'login.html';
}