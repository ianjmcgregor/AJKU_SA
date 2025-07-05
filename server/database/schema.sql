-- Users table (for authentication)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'instructor' CHECK (role IN ('admin', 'instructor', 'member')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Members table
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    phone TEXT,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    medical_conditions TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended', 'expired')),
    photo_path TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Grades/Belts table
CREATE TABLE grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- e.g., "White Belt", "Yellow Belt", "Black Belt 1st Dan"
    color TEXT NOT NULL,
    level INTEGER NOT NULL, -- 1 for white, 2 for yellow, etc.
    dan_level INTEGER DEFAULT 0, -- 0 for kyu grades, 1+ for dan grades
    minimum_age INTEGER,
    minimum_training_hours INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Grade criteria table
CREATE TABLE grade_criteria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_id INTEGER NOT NULL,
    category TEXT NOT NULL, -- e.g., "Kata", "Kumite", "Basics", "Physical"
    name TEXT NOT NULL, -- e.g., "Heian Shodan", "Front Kick", "Push-ups"
    description TEXT,
    required BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES grades(id)
);

-- Member grades (current and historical)
CREATE TABLE member_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    grade_id INTEGER NOT NULL,
    achieved_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    examiner_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id)
);

-- Member progress tracking against grade criteria
CREATE TABLE member_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    grade_criteria_id INTEGER NOT NULL,
    target_grade_id INTEGER NOT NULL,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
    notes TEXT,
    instructor_id INTEGER,
    last_assessed DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (grade_criteria_id) REFERENCES grade_criteria(id),
    FOREIGN KEY (target_grade_id) REFERENCES grades(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Classes/Sessions table
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    instructor_id INTEGER,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER,
    grade_requirements TEXT, -- JSON array of grade IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Attendance records
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    hours_attended DECIMAL(4,2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Payment records
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('monthly', 'quarterly', 'annual', 'grading', 'gear', 'other')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online')),
    payment_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    description TEXT,
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Offline sync tracking
CREATE TABLE sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    data TEXT, -- JSON data for the record
    synced BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_members_join_date ON members(join_date);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, date);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX idx_payments_member_status ON payments(member_id, status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_member_grades_current ON member_grades(member_id, is_current);
CREATE INDEX idx_member_progress_member_grade ON member_progress(member_id, target_grade_id);
CREATE INDEX idx_sync_log_synced ON sync_log(synced);