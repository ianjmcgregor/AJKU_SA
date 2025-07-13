const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Database connection
const DB_PATH = path.join(__dirname, 'database/dojo.db');
const db = new sqlite3.Database(DB_PATH);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../client/dist')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    next();
};

// AUTH ROUTES
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], handleValidationErrors, (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    });
});

app.post('/api/auth/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], handleValidationErrors, (req, res) => {
    const { email, password, role = 'member' } = req.body;
    const password_hash = bcrypt.hashSync(password, 10);

    db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, password_hash, role], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }

            const token = jwt.sign(
                { id: this.lastID, email, role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                token,
                user: {
                    id: this.lastID,
                    email,
                    role
                }
            });
        });
});

// MEMBER ROUTES
app.get('/api/members', authenticateToken, (req, res) => {
    const { status, search, limit = 50, offset = 0 } = req.query;
    let query = `
        SELECT m.*, g.name as current_grade, g.color as grade_color
        FROM members m
        LEFT JOIN grades g ON m.current_grade_id = g.id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        query += ' AND m.status = ?';
        params.push(status);
    }

    if (search) {
        query += ' AND (m.first_name LIKE ? OR m.last_name LIKE ? OR m.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY m.last_name, m.first_name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.get('/api/members/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT m.*, g.name as current_grade, g.color as grade_color
        FROM members m
        LEFT JOIN grades g ON m.current_grade_id = g.id
        WHERE m.id = ?
    `, [id], (err, member) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(member);
    });
});

app.post('/api/members', authenticateToken, requireRole(['admin', 'instructor']), [
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('date_of_birth')
        .notEmpty().withMessage('Date of birth is required')
        .custom((value) => {
            if (!value) return false; // Require date of birth for new members
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Date of birth must be a valid date');
            }
            const today = new Date();
            if (date > today) {
                throw new Error('Date of birth cannot be in the future');
            }
            const age = today.getFullYear() - date.getFullYear();
            if (age > 120) {
                throw new Error('Please check the date of birth (age over 120)');
            }
            return true;
        }),
    body('email').optional().isEmail().normalizeEmail(),
    body('instructor_role').optional().isIn(['main_instructor', 'senior_instructor', 'developing_instructor', 'student'])
], handleValidationErrors, (req, res) => {
    const {
        first_name, last_name, other_names, date_of_birth, gender, instructor_role,
        address, phone_number, email, guardian_name, guardian_phone,
        guardian_email, guardian_relationship, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship,
        medical_conditions, special_needs, photo_permission,
        social_media_permission, notes, current_grade_id
    } = req.body;

    db.run(`
        INSERT INTO members (
            first_name, last_name, other_names, date_of_birth, gender, instructor_role,
            address, phone_number, email, guardian_name, guardian_phone,
            guardian_email, guardian_relationship, emergency_contact_name,
            emergency_contact_phone, emergency_contact_relationship,
            medical_conditions, special_needs, photo_permission,
            social_media_permission, notes, current_grade_id, main_dojo_id, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
        first_name, last_name, other_names, date_of_birth, gender, instructor_role,
        address, phone_number, email, guardian_name, guardian_phone,
        guardian_email, guardian_relationship, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship,
        medical_conditions, special_needs, photo_permission ? 1 : 0,
        social_media_permission ? 1 : 0, notes, current_grade_id, 
        req.body.main_dojo_id, req.body.status || 'active'
    ], function(err) {
        if (err) {
            console.error('Error creating member:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Get the created member
        db.get(`
            SELECT m.*, g.name as current_grade, g.color as grade_color
            FROM members m
            LEFT JOIN grades g ON m.current_grade_id = g.id
            WHERE m.id = ?
        `, [this.lastID], (err, newMember) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json(newMember);
        });
    });
});

app.put('/api/members/:id', authenticateToken, requireRole(['admin', 'instructor']), [
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('date_of_birth')
        .optional()
        .custom((value) => {
            if (!value) return true; // Allow empty/null values
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Date of birth must be a valid date');
            }
            const today = new Date();
            if (date > today) {
                throw new Error('Date of birth cannot be in the future');
            }
            const age = today.getFullYear() - date.getFullYear();
            if (age > 120) {
                throw new Error('Please check the date of birth (age over 120)');
            }
            return true;
        }),
    body('email').optional().isEmail().normalizeEmail(),
    body('instructor_role').optional().isIn(['main_instructor', 'senior_instructor', 'developing_instructor', 'student'])
], handleValidationErrors, (req, res) => {
    const { id } = req.params;
    const {
        first_name, last_name, other_names, date_of_birth, gender, instructor_role,
        address, phone_number, email, guardian_name, guardian_phone,
        guardian_email, guardian_relationship, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship,
        medical_conditions, special_needs, photo_permission,
        social_media_permission, notes, current_grade_id, status
    } = req.body;

    db.run(`
        UPDATE members SET
            first_name = ?, last_name = ?, other_names = ?, date_of_birth = ?, gender = ?, instructor_role = ?,
            address = ?, phone_number = ?, email = ?, guardian_name = ?, guardian_phone = ?,
            guardian_email = ?, guardian_relationship = ?, emergency_contact_name = ?,
            emergency_contact_phone = ?, emergency_contact_relationship = ?,
            medical_conditions = ?, special_needs = ?, photo_permission = ?,
            social_media_permission = ?, notes = ?, current_grade_id = ?, main_dojo_id = ?, status = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `, [
        first_name, last_name, other_names, date_of_birth, gender, instructor_role,
        address, phone_number, email, guardian_name, guardian_phone,
        guardian_email, guardian_relationship, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship,
        medical_conditions, special_needs, photo_permission ? 1 : 0,
        social_media_permission ? 1 : 0, notes, current_grade_id, 
        req.body.main_dojo_id, status || 'active', id
    ], function(err) {
        if (err) {
            console.error('Error updating member:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        // Get the updated member
        db.get(`
            SELECT m.*, g.name as current_grade, g.color as grade_color
            FROM members m
            LEFT JOIN grades g ON m.current_grade_id = g.id
            WHERE m.id = ?
        `, [id], (err, updatedMember) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(updatedMember);
        });
    });
});

app.delete('/api/members/:id', authenticateToken, requireRole(['admin', 'instructor']), (req, res) => {
    const { id } = req.params;
    
    db.run(`
        UPDATE members SET status = 'inactive', updated_at = datetime('now') WHERE id = ?
    `, [id], function(err) {
        if (err) {
            console.error('Error deleting member:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json({ message: 'Member deactivated successfully' });
    });
});

app.patch('/api/members/:id/reactivate', authenticateToken, requireRole(['admin', 'instructor']), (req, res) => {
    const { id } = req.params;
    
    db.run(`
        UPDATE members SET status = 'active', updated_at = datetime('now') WHERE id = ?
    `, [id], function(err) {
        if (err) {
            console.error('Error reactivating member:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json({ message: 'Member reactivated successfully' });
    });
});

// ATTENDANCE ROUTES
app.get('/api/attendance', authenticateToken, (req, res) => {
    const { member_id, class_id, date_from, date_to, status, attendance_type, limit = 100, offset = 0 } = req.query;
    let query = `
        SELECT a.*, m.first_name, m.last_name, c.name as class_name, c.duration_hours,
               u.email as adjusted_by_email
        FROM attendance a
        JOIN members m ON a.member_id = m.id
        JOIN classes c ON a.class_id = c.id
        LEFT JOIN users u ON a.adjusted_by = u.id
        WHERE 1=1
    `;
    const params = [];

    if (member_id) {
        query += ' AND a.member_id = ?';
        params.push(member_id);
    }

    if (class_id) {
        query += ' AND a.class_id = ?';
        params.push(class_id);
    }

    if (date_from) {
        query += ' AND a.date >= ?';
        params.push(date_from);
    }

    if (date_to) {
        query += ' AND a.date <= ?';
        params.push(date_to);
    }

    if (status) {
        query += ' AND a.status = ?';
        params.push(status);
    }

    if (attendance_type) {
        query += ' AND a.attendance_type = ?';
        params.push(attendance_type);
    }

    query += ' ORDER BY a.date DESC, a.check_in_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get attendance for a specific date and class
app.get('/api/attendance/class/:class_id/date/:date', authenticateToken, (req, res) => {
    const { class_id, date } = req.params;
    
    const query = `
        SELECT a.*, m.first_name, m.last_name, m.current_grade_id, g.name as grade_name, g.color as grade_color
        FROM attendance a
        JOIN members m ON a.member_id = m.id
        LEFT JOIN grades g ON m.current_grade_id = g.id
        WHERE a.class_id = ? AND a.date = ?
        ORDER BY m.last_name, m.first_name
    `;
    
    db.all(query, [class_id, date], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Record regular attendance
app.post('/api/attendance', authenticateToken, requireRole(['admin', 'instructor']), [
    body('member_id').isInt({ gt: 0 }),
    body('class_id').isInt({ gt: 0 }),
    body('date').isISO8601().toDate(),
    body('status').optional().isIn(['present', 'absent', 'late', 'left_early', 'excused']),
    body('hours_attended').optional().isFloat({ min: 0, max: 24 })
], handleValidationErrors, (req, res) => {
    const { member_id, class_id, date, status = 'present', hours_attended, notes } = req.body;
    const instructor_id = req.user.id;

    // Check if attendance already exists for this member, class, and date
    db.get('SELECT id FROM attendance WHERE member_id = ? AND class_id = ? AND date = ?', 
        [member_id, class_id, date], (err, existing) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (existing) {
                return res.status(400).json({ error: 'Attendance already recorded for this member on this date' });
            }

            // Get class duration if hours_attended not provided
            let finalHours = hours_attended;
            if (!finalHours) {
                db.get('SELECT duration_hours FROM classes WHERE id = ?', [class_id], (err, classInfo) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    finalHours = classInfo ? classInfo.duration_hours : 1.0;
                    
                    insertAttendance();
                });
            } else {
                insertAttendance();
            }

            function insertAttendance() {
                const checkInTime = status === 'present' ? new Date().toISOString() : null;
                
                db.run(`INSERT INTO attendance (member_id, class_id, date, check_in_time, hours_attended, status, attendance_type, notes, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, 'regular', ?, CURRENT_TIMESTAMP)`,
                    [member_id, class_id, date, checkInTime, finalHours, status, notes], function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }
                        res.status(201).json({ 
                            id: this.lastID, 
                            member_id, 
                            class_id, 
                            date, 
                            status,
                            hours_attended: finalHours,
                            attendance_type: 'regular'
                        });
                    });
            }
        });
});

// Backdate attendance
app.post('/api/attendance/backdate', authenticateToken, requireRole(['admin', 'instructor']), [
    body('member_id').isInt({ gt: 0 }),
    body('class_id').isInt({ gt: 0 }),
    body('date').isISO8601().toDate(),
    body('status').isIn(['present', 'absent', 'late', 'left_early', 'excused']),
    body('hours_attended').optional().isFloat({ min: 0, max: 24 }),
    body('check_in_time').optional().isISO8601().toDate(),
    body('check_out_time').optional().isISO8601().toDate(),
    body('adjustment_reason').notEmpty().trim()
], handleValidationErrors, (req, res) => {
    const { member_id, class_id, date, status, hours_attended, check_in_time, check_out_time, adjustment_reason, notes } = req.body;
    const adjusted_by = req.user.id;

    // Check if attendance already exists
    db.get('SELECT id FROM attendance WHERE member_id = ? AND class_id = ? AND date = ?', 
        [member_id, class_id, date], (err, existing) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (existing) {
                return res.status(400).json({ error: 'Attendance already recorded for this member on this date' });
            }

            // Get class duration if hours_attended not provided
            let finalHours = hours_attended;
            if (!finalHours) {
                db.get('SELECT duration_hours FROM classes WHERE id = ?', [class_id], (err, classInfo) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    finalHours = classInfo ? classInfo.duration_hours : 1.0;
                    insertBackdatedAttendance();
                });
            } else {
                insertBackdatedAttendance();
            }

            function insertBackdatedAttendance() {
                db.run(`INSERT INTO attendance (member_id, class_id, date, check_in_time, check_out_time, hours_attended, status, attendance_type, adjusted_by, adjustment_reason, notes, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'backdated', ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [member_id, class_id, date, check_in_time, check_out_time, finalHours, status, adjusted_by, adjustment_reason, notes], function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }
                        res.status(201).json({ 
                            id: this.lastID, 
                            member_id, 
                            class_id, 
                            date, 
                            status,
                            hours_attended: finalHours,
                            attendance_type: 'backdated',
                            adjustment_reason
                        });
                    });
            }
        });
});

// Manual adjustment of existing attendance
app.put('/api/attendance/:id', authenticateToken, requireRole(['admin', 'instructor']), [
    body('status').optional().isIn(['present', 'absent', 'late', 'left_early', 'excused']),
    body('hours_attended').optional().isFloat({ min: 0, max: 24 }),
    body('check_in_time').optional().isISO8601().toDate(),
    body('check_out_time').optional().isISO8601().toDate(),
    body('adjustment_reason').notEmpty().trim()
], handleValidationErrors, (req, res) => {
    const { id } = req.params;
    const { status, hours_attended, check_in_time, check_out_time, adjustment_reason, notes } = req.body;
    const adjusted_by = req.user.id;

    db.run(`UPDATE attendance SET 
            status = COALESCE(?, status),
            hours_attended = COALESCE(?, hours_attended),
            check_in_time = COALESCE(?, check_in_time),
            check_out_time = COALESCE(?, check_out_time),
            attendance_type = 'manual_adjustment',
            adjusted_by = ?,
            adjustment_reason = ?,
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [status, hours_attended, check_in_time, check_out_time, adjusted_by, adjustment_reason, notes, id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Attendance record not found' });
            }
            res.json({ 
                id, 
                status, 
                hours_attended, 
                attendance_type: 'manual_adjustment',
                adjustment_reason 
            });
        });
});

// Live attendance session management
app.post('/api/attendance/sessions', authenticateToken, requireRole(['admin', 'instructor']), [
    body('class_id').isInt({ gt: 0 }),
    body('date').isISO8601().toDate()
], handleValidationErrors, (req, res) => {
    const { class_id, date, notes } = req.body;
    const instructor_id = req.user.id;

    db.run(`INSERT INTO attendance_sessions (class_id, date, instructor_id, start_time, status, notes) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'active', ?)`,
        [class_id, date, instructor_id, notes], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ 
                id: this.lastID, 
                class_id, 
                date, 
                status: 'active',
                start_time: new Date().toISOString()
            });
        });
});

// End attendance session
app.put('/api/attendance/sessions/:id/end', authenticateToken, requireRole(['admin', 'instructor']), (req, res) => {
    const { id } = req.params;

    db.run(`UPDATE attendance_sessions SET 
            end_time = CURRENT_TIMESTAMP, 
            status = 'ended' 
            WHERE id = ?`,
        [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.json({ id, status: 'ended', end_time: new Date().toISOString() });
        });
});

// Live attendance check-in/check-out
app.post('/api/attendance/live', authenticateToken, requireRole(['admin', 'instructor']), [
    body('session_id').isInt({ gt: 0 }),
    body('member_id').isInt({ gt: 0 }),
    body('action').isIn(['check_in', 'check_out'])
], handleValidationErrors, (req, res) => {
    const { session_id, member_id, action } = req.body;
    const currentTime = new Date().toISOString();

    if (action === 'check_in') {
        // Check if already checked in
        db.get('SELECT id FROM live_attendance WHERE session_id = ? AND member_id = ? AND check_out_time IS NULL', 
            [session_id, member_id], (err, existing) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (existing) {
                    return res.status(400).json({ error: 'Member already checked in' });
                }

                db.run(`INSERT INTO live_attendance (session_id, member_id, check_in_time, status) 
                        VALUES (?, ?, ?, 'present')`,
                    [session_id, member_id, currentTime], function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }
                        res.status(201).json({ 
                            id: this.lastID, 
                            session_id, 
                            member_id, 
                            action: 'check_in',
                            check_in_time: currentTime 
                        });
                    });
            });
    } else {
        // Check out
        db.run(`UPDATE live_attendance SET 
                check_out_time = ?, 
                status = 'left_early' 
                WHERE session_id = ? AND member_id = ? AND check_out_time IS NULL`,
            [currentTime, session_id, member_id], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (this.changes === 0) {
                    return res.status(400).json({ error: 'Member not checked in or already checked out' });
                }
                res.json({ 
                    session_id, 
                    member_id, 
                    action: 'check_out',
                    check_out_time: currentTime 
                });
            });
    }
});

// Get live attendance for a session
app.get('/api/attendance/sessions/:id/live', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT la.*, m.first_name, m.last_name, m.current_grade_id, g.name as grade_name, g.color as grade_color
        FROM live_attendance la
        JOIN members m ON la.member_id = m.id
        LEFT JOIN grades g ON m.current_grade_id = g.id
        WHERE la.session_id = ?
        ORDER BY la.check_in_time DESC
    `;
    
    db.all(query, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Finalize live attendance to permanent records
app.post('/api/attendance/sessions/:id/finalize', authenticateToken, requireRole(['admin', 'instructor']), (req, res) => {
    const { id } = req.params;

    // Get session details
    db.get('SELECT * FROM attendance_sessions WHERE id = ?', [id], (err, session) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Get all live attendance records for this session
        db.all('SELECT * FROM live_attendance WHERE session_id = ?', [id], (err, liveRecords) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Insert into permanent attendance table
            const insertPromises = liveRecords.map(record => {
                return new Promise((resolve, reject) => {
                    const hoursAttended = record.check_out_time ? 
                        (new Date(record.check_out_time) - new Date(record.check_in_time)) / (1000 * 60 * 60) : 
                        session.duration_hours || 1.0;

                    db.run(`INSERT OR REPLACE INTO attendance 
                            (member_id, class_id, date, check_in_time, check_out_time, hours_attended, status, attendance_type, notes, created_at) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'live_update', ?, CURRENT_TIMESTAMP)`,
                        [record.member_id, session.class_id, session.date, record.check_in_time, record.check_out_time, hoursAttended, record.status, 'Live session attendance'],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        });
                });
            });

            Promise.all(insertPromises)
                .then(() => {
                    res.json({ 
                        message: 'Attendance finalized successfully', 
                        records_processed: liveRecords.length 
                    });
                })
                .catch(err => {
                    res.status(500).json({ error: 'Error finalizing attendance' });
                });
        });
    });
});

// DOJOS ROUTES
app.get('/api/dojos', authenticateToken, (req, res) => {
    db.all('SELECT * FROM dojos ORDER BY name', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/dojos', authenticateToken, requireRole(['admin']), [
    body('name').notEmpty().trim(),
    body('address').optional().trim(),
    body('phone').optional().trim(),
    body('email').optional().isEmail().normalizeEmail()
], handleValidationErrors, (req, res) => {
    const { name, address, phone, email, primary_instructor_id } = req.body;

    db.run(`INSERT INTO dojos (name, address, phone, email, primary_instructor_id, created_at) 
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [name, address, phone, email, primary_instructor_id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ 
                id: this.lastID, 
                name, 
                address, 
                phone, 
                email, 
                primary_instructor_id 
            });
        });
});

// CLASSES ROUTES
app.get('/api/classes', authenticateToken, (req, res) => {
    const { active, instructor_id, dojo_id } = req.query;
    let query = `
        SELECT c.*, u.email as instructor_email, d.name as dojo_name
        FROM classes c
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN dojos d ON c.dojo_id = d.id
        WHERE 1=1
    `;
    const params = [];

    if (active !== undefined) {
        query += ' AND c.active = ?';
        params.push(active === 'true' ? 1 : 0);
    }

    if (instructor_id) {
        query += ' AND c.instructor_id = ?';
        params.push(instructor_id);
    }

    if (dojo_id) {
        query += ' AND c.dojo_id = ?';
        params.push(dojo_id);
    }

    query += ' ORDER BY c.day_of_week, c.start_time';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.get('/api/classes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT c.*, u.email as instructor_email, d.name as dojo_name
        FROM classes c
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN dojos d ON c.dojo_id = d.id
        WHERE c.id = ?
    `, [id], (err, classInfo) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!classInfo) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json(classInfo);
    });
});

app.post('/api/classes', authenticateToken, requireRole(['admin', 'instructor']), [
    body('name').notEmpty().trim(),
    body('instructor_id').isInt({ gt: 0 }),
    body('day_of_week').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('duration_hours').optional().isFloat({ min: 0.25, max: 8 }),
    body('class_type').optional().isIn(['regular', 'junior', 'senior', 'advanced', 'special'])
], handleValidationErrors, (req, res) => {
    const { name, description, instructor_id, dojo_id, day_of_week, start_time, end_time, duration_hours, class_type, max_participants } = req.body;

    db.run(`INSERT INTO classes (name, description, instructor_id, dojo_id, day_of_week, start_time, end_time, duration_hours, class_type, max_participants, active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
        [name, description, instructor_id, dojo_id, day_of_week, start_time, end_time, duration_hours || 1.0, class_type || 'regular', max_participants], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ 
                id: this.lastID, 
                name, 
                instructor_id, 
                day_of_week, 
                start_time, 
                end_time,
                duration_hours: duration_hours || 1.0,
                class_type: class_type || 'regular'
            });
        });
});

// GRADES ROUTES
app.get('/api/grades', authenticateToken, (req, res) => {
    db.all('SELECT * FROM grades ORDER BY order_rank', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.get('/api/grades/:id/criteria', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.all('SELECT * FROM grade_criteria WHERE grade_id = ? ORDER BY criterion', [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// MEMBER PROGRESS ROUTES
app.get('/api/members/:id/progress', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { target_grade_id } = req.query;
    
    let query = `
        SELECT mp.*, gc.name as criteria_name, gc.description as criteria_description, 
               gc.category, g.name as grade_name
        FROM member_progress mp
        JOIN grade_criteria gc ON mp.grade_criteria_id = gc.id
        JOIN grades g ON mp.target_grade_id = g.id
        WHERE mp.member_id = ?
    `;
    const params = [id];

    if (target_grade_id) {
        query += ' AND mp.target_grade_id = ?';
        params.push(target_grade_id);
    }

    query += ' ORDER BY g.level, gc.category, gc.name';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/members/:id/progress', authenticateToken, requireRole(['admin', 'instructor']), [
    body('grade_criteria_id').isInt({ gt: 0 }),
    body('target_grade_id').isInt({ gt: 0 }),
    body('status').isIn(['not_started', 'in_progress', 'completed', 'mastered'])
], handleValidationErrors, (req, res) => {
    const { id } = req.params;
    const { grade_criteria_id, target_grade_id, status, notes } = req.body;
    const instructor_id = req.user.id;

    db.run(`INSERT OR REPLACE INTO member_progress 
            (member_id, grade_criteria_id, target_grade_id, status, notes, instructor_id, last_assessed, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_TIMESTAMP)`,
        [id, grade_criteria_id, target_grade_id, status, notes, instructor_id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ id: this.lastID, member_id: id, grade_criteria_id, target_grade_id, status, notes });
        });
});

// PAYMENTS ROUTES
app.get('/api/payments', authenticateToken, (req, res) => {
    const { member_id, status, payment_type, limit = 100, offset = 0 } = req.query;
    let query = `
        SELECT p.*, m.first_name, m.last_name
        FROM payments p
        JOIN members m ON p.member_id = m.id
        WHERE 1=1
    `;
    const params = [];

    if (member_id) {
        query += ' AND p.member_id = ?';
        params.push(member_id);
    }

    if (status) {
        query += ' AND p.status = ?';
        params.push(status);
    }

    if (payment_type) {
        query += ' AND p.payment_type = ?';
        params.push(payment_type);
    }

    query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/payments', authenticateToken, requireRole(['admin', 'instructor']), [
    body('member_id').isInt({ gt: 0 }),
    body('amount').isFloat({ gt: 0 }),
    body('payment_type').isIn(['monthly', 'quarterly', 'annual', 'grading', 'gear', 'other'])
], handleValidationErrors, (req, res) => {
    const paymentData = req.body;
    const fields = Object.keys(paymentData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => paymentData[field]);

    db.run(`INSERT INTO payments (${fields.join(', ')}) VALUES (${placeholders})`,
        values, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ id: this.lastID, ...paymentData });
        });
});

// CLASSES ROUTES
app.get('/api/classes', authenticateToken, (req, res) => {
    const { date_from, date_to, instructor_id, limit = 100, offset = 0 } = req.query;
    let query = `
        SELECT c.*, u.username as instructor_name
        FROM classes c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (date_from) {
        query += ' AND c.date >= ?';
        params.push(date_from);
    }

    if (date_to) {
        query += ' AND c.date <= ?';
        params.push(date_to);
    }

    if (instructor_id) {
        query += ' AND c.instructor_id = ?';
        params.push(instructor_id);
    }

    query += ' ORDER BY c.date DESC, c.start_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/classes', authenticateToken, requireRole(['admin', 'instructor']), [
    body('name').notEmpty().trim(),
    body('date').isISO8601().toDate(),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], handleValidationErrors, (req, res) => {
    const classData = req.body;
    const fields = Object.keys(classData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => classData[field]);

    db.run(`INSERT INTO classes (${fields.join(', ')}) VALUES (${placeholders})`,
        values, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ id: this.lastID, ...classData });
        });
});

// DASHBOARD STATS
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const stats = {};
    
    // Get member counts by status
    db.all('SELECT status, COUNT(*) as count FROM members GROUP BY status', (err, memberStats) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        stats.members = memberStats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            return acc;
        }, {});

        // Get attendance this month
        const thisMonth = moment().format('YYYY-MM');
        db.get(`SELECT COUNT(*) as count FROM attendance WHERE date LIKE ?`, [`${thisMonth}%`], (err, attendanceCount) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            stats.attendance_this_month = attendanceCount.count;

            // Get overdue payments
            db.get(`SELECT COUNT(*) as count FROM payments WHERE status = 'pending' AND due_date < CURRENT_DATE`, (err, overdueCount) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                stats.overdue_payments = overdueCount.count;

                // Get revenue this month
                db.get(`SELECT SUM(amount) as total FROM payments WHERE status = 'completed' AND paid_date LIKE ?`, [`${thisMonth}%`], (err, revenue) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    stats.revenue_this_month = revenue.total || 0;
                    res.json(stats);
                });
            });
        });
    });
});

// OFFLINE SYNC ROUTES
app.post('/api/sync/upload', authenticateToken, (req, res) => {
    const { syncData } = req.body;
    
    if (!Array.isArray(syncData)) {
        return res.status(400).json({ error: 'Invalid sync data format' });
    }

    const results = [];
    let processed = 0;

    syncData.forEach(item => {
        const { table, action, data, client_id } = item;
        
        // Process each sync item based on table and action
        // This is a simplified version - in production, you'd want more robust conflict resolution
        
        if (action === 'create') {
            // Handle create operations
            const fields = Object.keys(data);
            const placeholders = fields.map(() => '?').join(', ');
            const values = fields.map(field => data[field]);
            
            db.run(`INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
                values, function(err) {
                    processed++;
                    if (err) {
                        results.push({ client_id, success: false, error: err.message });
                    } else {
                        results.push({ client_id, success: true, server_id: this.lastID });
                    }
                    
                    if (processed === syncData.length) {
                        res.json({ results });
                    }
                });
        } else if (action === 'update') {
            // Handle update operations
            const fields = Object.keys(data);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = [...fields.map(field => data[field]), data.id];
            
            db.run(`UPDATE ${table} SET ${setClause} WHERE id = ?`,
                values, function(err) {
                    processed++;
                    if (err) {
                        results.push({ client_id, success: false, error: err.message });
                    } else {
                        results.push({ client_id, success: true, affected: this.changes });
                    }
                    
                    if (processed === syncData.length) {
                        res.json({ results });
                    }
                });
        }
    });
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database: ${DB_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close();
    process.exit(0);
});