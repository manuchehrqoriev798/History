import { db, auth } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const email = `${name}@example.com`; // Ensure this format matches stored emails

    try {
        // Authenticate with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user data from Realtime Database
        const userRef = ref(db, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        
        if (!userSnapshot.exists()) {
            await auth.signOut();
            errorMessage.textContent = 'User not found in database.';
            return;
        }

        const userData = userSnapshot.val();
        
        // Securely store only necessary data
        sessionStorage.setItem('userRole', userData.role);
        sessionStorage.setItem('userName', name);

        // Redirect based on role
        window.location.href = userData.role === 'admin' ? 'admin.html' : 'user.html';

    } catch (error) {
        console.error('Login error:', error);
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage.textContent = 'Invalid username or password';
                break;
            case 'auth/too-many-requests':
                errorMessage.textContent = 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage.textContent = 'Login failed. Please try again.';
                break;
        }
    }
});
