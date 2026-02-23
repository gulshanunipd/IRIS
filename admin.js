document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('isrs_token');

    // 1. Strict Authentication Check
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const localUserStr = localStorage.getItem('isrs_user');
    if (!localUserStr) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const localUser = JSON.parse(localUserStr);
        if (localUser.role !== 'admin') {
            alert('Access Denied. Administrator privileges required.');
            window.location.href = 'dashboard.html';
            return;
        }
    } catch (e) {
        window.location.href = 'login.html';
        return;
    }

    const loadingId = document.getElementById('loading-indicator');
    const adminContent = document.getElementById('admin-content');
    const userTableBody = document.getElementById('user-table-body');
    const activityFeed = document.getElementById('activity-feed');
    const userCount = document.getElementById('user-count');

    // 2. Fetch Admin Data
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Your session implies you are an admin, but the server rejected your token. Please log in again.');
            localStorage.removeItem('isrs_token');
            localStorage.removeItem('isrs_user');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            const { users, recentActivity } = data;

            loadingId.style.display = 'none';
            adminContent.style.display = 'grid';

            // Populate Users Table
            userCount.textContent = users.length;
            if (users && users.length > 0) {
                users.forEach(user => {
                    const tr = document.createElement('tr');

                    const roleBadge = user.role === 'admin'
                        ? '<span class="user-badge admin"><i class="fa-solid fa-shield"></i> Admin</span>'
                        : '<span class="user-badge">User</span>';

                    const memType = user.membership_type || 'None';

                    const date = new Date(user.created_at);
                    const formattedDate = date.toLocaleDateString();

                    // Optional Avatar
                    const avatarHtml = user.profile_image_url
                        ? `<img src="${user.profile_image_url}" style="width: 24px; height: 24px; border-radius: 50%; vertical-align: middle; margin-right: 8px; object-fit: cover;">`
                        : `<i class="fa-solid fa-user" style="color: var(--clr-text-muted); margin-right: 8px; vertical-align: middle;"></i>`;

                    tr.innerHTML = `
                        <td>${avatarHtml} ${user.name}</td>
                        <td>${user.email}</td>
                        <td>${roleBadge}</td>
                        <td>${memType}</td>
                        <td>${formattedDate}</td>
                    `;
                    userTableBody.appendChild(tr);
                });
            } else {
                userTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found.</td></tr>';
            }

            // Populate Activity Feed
            if (recentActivity && recentActivity.length > 0) {
                recentActivity.forEach(log => {
                    const li = document.createElement('li');
                    li.className = 'feed-item';

                    const logDate = new Date(log.timestamp);
                    const timeString = logDate.toLocaleDateString() + ' ' + logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    li.innerHTML = `
                        <div class="feed-item-header">
                            <span class="feed-user">${log.user_name} <span style="font-weight: 400; font-size: 0.8rem;">(${log.user_email})</span></span>
                            <span class="feed-time">${timeString}</span>
                        </div>
                        <div class="feed-action">${log.action}</div>
                    `;
                    activityFeed.appendChild(li);
                });
            } else {
                activityFeed.innerHTML = '<li class="feed-item">No recent activity.</li>';
            }

        } else {
            console.error(data.error);
            alert("Failed to load admin data.");
        }
    } catch (error) {
        console.error('Fetch error:', error);
        loadingId.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Network error connecting to admin server.';
    }
});
