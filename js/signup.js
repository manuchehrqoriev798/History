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
    const email = `${name}@example.com`;

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

        if (codes.admin && codes.admin[loginCode]) {
            role = 'admin';
        } else if (codes.user && codes.user[loginCode]) {
            role = 'user';
        } else {
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

        // Create success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Account created successfully!';
        signupForm.appendChild(successMessage);

        // Disable the form inputs but keep them visible
        Array.from(signupForm.elements).forEach(element => {
            element.disabled = true;
        });

        // Create a hidden iframe for the redirect
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Wait for password manager
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Perform the redirect
        const redirectURL = role === 'admin' ? 'admin.html' : 'user.html';
        window.location.href = redirectURL;

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