const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const authAlert = document.getElementById('auth-alert');

    // Utility to show alerts
    const showAlert = (message, type = 'error') => {
        if (!authAlert) return;
        authAlert.textContent = message;
        authAlert.className = `alert-${type}`;
        authAlert.style.display = 'block';

        // Hide after 5 seconds
        setTimeout(() => {
            authAlert.style.display = 'none';
        }, 5000);
    };

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('login-submit-btn');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success! Save token and user info
                    localStorage.setItem('isrs_token', data.token);
                    localStorage.setItem('isrs_user', JSON.stringify(data.user));

                    showAlert('Login successful! Redirecting...', 'success');

                    // Redirect to Dashboard page after a short delay
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    // Error from server
                    showAlert(data.error || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Login Error:', error);
                showAlert('Network error. Please try again later.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Sign In <i class="fa-solid fa-right-to-bracket" style="margin-left: 5px;"></i>';
            }
        });
    }

    // Handle Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = document.getElementById('signup-submit-btn');

            // Client-side validation
            if (password !== confirmPassword) {
                showAlert('Passwords do not match!');
                return;
            }

            if (password.length < 6) {
                showAlert('Password must be at least 6 characters long.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Registration successful! Please sign in.', 'success');

                    // Redirect to Login page after a short delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showAlert(data.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Signup Error:', error);
                showAlert('Network error. Please try again later.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Register <i class="fa-solid fa-user-plus" style="margin-left: 5px;"></i>';
            }
        });
    }

    // ---- Global Auth State Check ----
    // If we are on index.html, check if user is logged in
    const token = localStorage.getItem('isrs_token');
    const userStr = localStorage.getItem('isrs_user');

    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            // Update UI for logged in state
            const loginBtn = document.querySelector('.btn-login');
            if (loginBtn) {
                loginBtn.innerHTML = `<i class="fa-solid fa-user-circle"></i> Dashboard`;
                loginBtn.href = 'dashboard.html';
                // Remove the logout onclick handler so the link works normally
                loginBtn.onclick = null;
            }
        } catch (e) {
            console.error("Error parsing user data", e);
        }
    } else {
        // Ensure Login button points to login.html
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            loginBtn.onclick = () => window.location.href = 'login.html';
        }
    }
});
