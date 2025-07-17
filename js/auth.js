// ============================================
// AUTHENTICATION SYSTEM
// ============================================

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupAfterDOMReady();
            });
        } else {
            this.setupAfterDOMReady();
        }
    }

    setupAfterDOMReady() {
        // Check if user is already logged in
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser && (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/'))) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Display current user
        this.displayCurrentUser();
    }

    handleLogin(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const username = formData.get('username').trim();
            const password = formData.get('password');

            console.log('Login attempt:', { username, password });

            // Validate input
            if (!username) {
                this.showError('Please enter a username');
                return;
            }

            if (password !== '12345') {
                this.showError('Invalid password. Default password is 12345');
                return;
            }

            // Check if user exists
            const users = this.getUsers();
            console.log('Existing users:', users);
            const userExists = users.some(user => user.username === username);

            if (!userExists) {
                this.showError('Username not found. Please sign up first.');
                return;
            }

            // Login successful
            this.loginUser(username);
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const username = formData.get('username').trim();

            console.log('Signup attempt:', { username });

            // Validate input
            if (!username) {
                this.showError('Please enter a username');
                return;
            }

            if (username.length < 3) {
                this.showError('Username must be at least 3 characters long');
                return;
            }

            // Check if user already exists
            const users = this.getUsers();
            const userExists = users.some(user => user.username === username);

            if (userExists) {
                this.showError('Username already exists. Please choose a different username.');
                return;
            }

            // Create new user
            const newUser = {
                username: username,
                password: '12345', // Default password
                createdAt: new Date().toISOString(),
                medications: [],
                exercises: [],
                appointments: [],
                medicationHistory: []
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            console.log('User created successfully:', newUser);

            // Auto-login after signup
            this.loginUser(username);
            this.showSuccess('Account created successfully!');
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('Signup failed. Please try again.');
        }
    }

    loginUser(username) {
        localStorage.setItem('currentUser', username);
        localStorage.setItem('loginTime', new Date().toISOString());
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('loginTime');
            window.location.href = 'index.html';
        }
    }

    getUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    getCurrentUser() {
        return localStorage.getItem('currentUser');
    }

    getCurrentUserData() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        const users = this.getUsers();
        return users.find(user => user.username === currentUser);
    }

    displayCurrentUser() {
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement) {
            const currentUser = this.getCurrentUser();
            currentUserElement.textContent = currentUser || 'Guest';
        }
    }

    showError(message) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create error alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `
            <div style="background: #dc3545; color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;

        // Insert alert
        const form = document.querySelector('.auth-form');
        if (form) {
            form.insertBefore(alert, form.firstChild);
        }

        // Remove alert after 5 seconds
        setTimeout(() => {
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create success alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `
            <div style="background: #28a745; color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;

        // Insert alert
        const form = document.querySelector('.auth-form');
        if (form) {
            form.insertBefore(alert, form.firstChild);
        }

        // Remove alert after 3 seconds
        setTimeout(() => {
            if (alert) {
                alert.remove();
            }
        }, 3000);
    }

    requireAuth() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    updateUserData(data) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.username === currentUser);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...data };
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        }
        return false;
    }

    exportUserData() {
        const userData = this.getCurrentUserData();
        if (!userData) return null;

        const exportData = {
            username: userData.username,
            medications: userData.medications || [],
            exercises: userData.exercises || [],
            appointments: userData.appointments || [],
            medicationHistory: userData.medicationHistory || [],
            exportDate: new Date().toISOString()
        };

        return exportData;
    }

    importUserData(importData) {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) return false;

            const users = this.getUsers();
            const userIndex = users.findIndex(user => user.username === currentUser);
            
            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    medications: importData.medications || [],
                    exercises: importData.exercises || [],
                    appointments: importData.appointments || [],
                    medicationHistory: importData.medicationHistory || []
                };
                
                localStorage.setItem('users', JSON.stringify(users));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing user data:', error);
            return false;
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other files
window.AuthManager = authManager;
