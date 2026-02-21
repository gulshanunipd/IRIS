const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'isrs-super-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// ==========================================
// User Authentication API Routes
// ==========================================

// Helper query function for promises
const dbGet = (query, params) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
};

const dbRun = (query, params) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            resolve(this.lastID);
        });
    });
};

// Helper query function to log activity
const logActivity = async (userId, action) => {
    try {
        await dbRun('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [userId, action]);
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
};

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// 1. Sign Up Route
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert into database
        const newUserId = await dbRun(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Record User Action
        await logActivity(newUserId, 'User registered account');

        res.status(201).json({
            message: 'User registered successfully',
            userId: newUserId
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// 2. Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Fetch user from db
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Record User Action
        await logActivity(user.id, 'User logged in');

        // Don't send the password back!
        delete user.password;

        res.status(200).json({
            message: 'Login successful',
            token,
            user
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// 3. Get User Dashboard Details (Protected Route)
app.get('/api/user/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch User Info
        const user = await dbGet('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch User Activity
        const dbAll = (query, params) => {
            return new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });
        };

        const activities = await dbAll('SELECT id, action, timestamp FROM activity_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20', [userId]);

        res.status(200).json({
            user,
            activities
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Internal server error fetching dashboard' });
    }
});

// 4. Log General Activity (Protected Route for frontend logging)
app.post('/api/user/activity', authenticateToken, async (req, res) => {
    try {
        const { action } = req.body;
        if (!action) return res.status(400).json({ error: 'Action is required' });

        await logActivity(req.user.id, action);
        res.status(201).json({ message: 'Activity logged successfully' });
    } catch (error) {
        console.error('Activity Logging Error:', error);
        res.status(500).json({ error: 'Internal server error logging activity' });
    }
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
