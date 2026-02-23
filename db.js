const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize a new database file
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create the users table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                membership_type TEXT,
                profile_image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating users table', err.message);
            } else {
                console.log('Users table created or already exists.');

                // Add new columns to existing table if they don't exist (SQLite doesn't have IF NOT EXISTS for ADD COLUMN so we ignore errors)
                db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN membership_type TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN profile_image_url TEXT`, () => { });

                // Seed Admin User
                const bcrypt = require('bcrypt');
                const adminEmail = 'admin@isrs.org';
                const adminPassword = 'Admin123!';

                db.get('SELECT id FROM users WHERE email = ?', [adminEmail], async (err, row) => {
                    if (!err && !row) {
                        try {
                            const hashedPwd = await bcrypt.hash(adminPassword, 10);
                            db.run(`INSERT INTO users (name, email, password, role, membership_type) VALUES (?, ?, ?, ?, ?)`,
                                ['System Admin', adminEmail, hashedPwd, 'admin', 'ISRS Fellow']);
                            console.log('Default Admin account seeded successfully.');
                        } catch (e) {
                            console.error('Failed to seed admin', e);
                        }
                    }
                });

                // Create activity_log table
                db.run(`
                    CREATE TABLE IF NOT EXISTS activity_log (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        action TEXT NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating activity_log table', err.message);
                    } else {
                        console.log('Activity log table created or already exists.');
                    }
                });
            }
        });
    }
});

module.exports = db;
