document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('isrs_token');

    // 1. Authentication Check
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    const loadingId = document.getElementById('loading-indicator');
    const dashboardContent = document.getElementById('dashboard-content');
    const greeting = document.getElementById('user-greeting');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileJoined = document.getElementById('profile-joined');
    const activityList = document.getElementById('activity-list');
    const noActivity = document.getElementById('no-activity');

    // 2. Fetch User Dashboard Data
    try {
        const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            // Token invalid or expired
            localStorage.removeItem('isrs_token');
            localStorage.removeItem('isrs_user');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            const { user, activities } = data;

            // Hide loading, show content
            loadingId.style.display = 'none';
            dashboardContent.style.display = 'grid';

            // Populate Profile Data
            const firstName = user.name.split(' ')[0];
            greeting.textContent = firstName + '!';

            profileName.textContent = user.name;
            profileEmail.textContent = user.email;

            // Format Date
            const date = new Date(user.created_at);
            profileJoined.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            // Populate Activities
            if (activities && activities.length > 0) {
                activities.forEach(log => {
                    const li = document.createElement('li');
                    li.className = 'activity-item';

                    const logDate = new Date(log.timestamp);
                    const timeString = logDate.toLocaleDateString() + ' at ' + logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    li.innerHTML = `
                        <div class="activity-desc"><i class="fa-solid fa-angle-right" style="color: var(--clr-primary); margin-right: 8px;"></i>${log.action}</div>
                        <div class="activity-time">${timeString}</div>
                    `;
                    activityList.appendChild(li);
                });
            } else {
                noActivity.style.display = 'block';
            }
        } else {
            // Error handling
            console.error(data.error);
            alert("Failed to load dashboard data. Please try again later.");
        }
    } catch (error) {
        console.error('Fetch error:', error);
        loadingId.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Network error connecting to server.';
    }

    // 3. Logout Handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isrs_token');
            localStorage.removeItem('isrs_user');
            window.location.href = 'login.html';
        });
    }
});
