-- Create tables for the karate dojo management system

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'member')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dojos/Locations table
CREATE TABLE IF NOT EXISTS dojos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    primary_instructor_id INTEGER,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_instructor_id) REFERENCES users (id)
);

-- Updated Members table with comprehensive fields
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    other_names TEXT,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    instructor_role TEXT CHECK (instructor_role IN ('main_instructor', 'senior_instructor', 'developing_instructor', 'student')),
    address TEXT,
    phone_number TEXT,
    email TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    guardian_relationship TEXT,
    guardian_required BOOLEAN DEFAULT 0,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    medical_conditions TEXT,
    special_needs TEXT,
    photo_permission BOOLEAN DEFAULT 0,
    social_media_permission BOOLEAN DEFAULT 0,
    notes TEXT,
    current_grade_id INTEGER,
    main_dojo_id INTEGER,
    join_date DATE DEFAULT (date('now')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_grade_id) REFERENCES grades (id),
    FOREIGN KEY (main_dojo_id) REFERENCES dojos (id)
);

-- Grades table for belt system
CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    order_rank INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Grade criteria table
CREATE TABLE IF NOT EXISTS grade_criteria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_id INTEGER NOT NULL,
    criterion TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES grades (id)
);

-- Member grades history
CREATE TABLE IF NOT EXISTS member_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    grade_id INTEGER NOT NULL,
    achieved_date DATE NOT NULL,
    instructor_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members (id),
    FOREIGN KEY (grade_id) REFERENCES grades (id),
    FOREIGN KEY (instructor_id) REFERENCES users (id)
);

-- Member progress tracking
CREATE TABLE IF NOT EXISTS member_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    criterion_id INTEGER NOT NULL,
    achieved BOOLEAN DEFAULT 0,
    achieved_date DATE,
    instructor_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members (id),
    FOREIGN KEY (criterion_id) REFERENCES grade_criteria (id),
    FOREIGN KEY (instructor_id) REFERENCES users (id)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    instructor_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_participants INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users (id)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT 1,
    hours_attended REAL DEFAULT 1.0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members (id),
    FOREIGN KEY (class_id) REFERENCES classes (id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('membership', 'grading', 'equipment', 'event', 'other')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'other')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    due_date DATE,
    paid_date DATE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members (id)
);

-- Sync log table for offline functionality
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    data TEXT,
    synced BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_name ON members (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_members_status ON members (status);
CREATE INDEX IF NOT EXISTS idx_members_grade ON members (current_grade_id);
CREATE INDEX IF NOT EXISTS idx_members_dojo ON members (main_dojo_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance (member_id);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments (member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_dojos_active ON dojos (active);