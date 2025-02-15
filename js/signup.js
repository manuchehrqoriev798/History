import { db, auth } from './firebase-config.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';

const signupForm = document.getElementById('signupForm');
const errorMessage = document.getElementById('errorMessage');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.toLowerCase();
    const loginCode = document.getElementById('loginCode').value.toUpperCase();
    const password = document.getElementById('password').value;
    const email = `${name}@example.com`; // Create email from username

    try {
        // First verify the login code
        const loginCodesRef = ref(db, 'logincodes');
        const codesSnapshot = await get(loginCodesRef);
        
        if (!codesSnapshot.exists()) {
            errorMessage.textContent = 'Invalid login code';
            return;
        }

        const codes = codesSnapshot.val();
        let role = null;

        // Check admin codes
        if (codes.admin && codes.admin[loginCode]) {
            role = 'admin';
        }
        // Check user codes
        else if (codes.user && codes.user[loginCode]) {
            role = 'user';
        }
        else {
            errorMessage.textContent = 'Invalid login code';
            return;
        }

        // Create Firebase Authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store additional user data in Realtime Database
        await set(ref(db, `users/${user.uid}`), {
            name: name,
            role: role,
            email: email,
            createdAt: new Date().toISOString()
        });

        // Set session data
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem('userName', name);

        // Add a delay before redirect to allow password save prompt
        setTimeout(() => {
            window.location.href = role === 'admin' ? 'admin.html' : 'user.html';
        }, 1000); // 1 second delay

    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
            errorMessage.textContent = 'This username is already taken';
        } else if (error.code === 'auth/weak-password') {
            errorMessage.textContent = 'Password should be at least 6 characters';
        } else {
            errorMessage.textContent = 'Error creating account. Please try again.';
        }
    }
}); 