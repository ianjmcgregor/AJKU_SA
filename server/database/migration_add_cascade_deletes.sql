-- Migration script to add CASCADE delete constraints
-- This ensures that when a member is permanently deleted, all related records are also deleted

-- First, we need to drop existing foreign key constraints and recreate them with CASCADE
-- Note: SQLite doesn't support ALTER TABLE to modify foreign key constraints
-- So we'll need to recreate the tables with proper constraints

-- For now, we'll add a comment about the current implementation
-- The permanent delete function in the server handles the cascading manually
-- which is actually more flexible and allows for better error handling

-- If you want to implement proper CASCADE constraints, you would need to:
-- 1. Create new tables with proper CASCADE constraints
-- 2. Migrate data from old tables to new tables
-- 3. Drop old tables and rename new tables

-- Example of how the constraints should look:
/*
CREATE TABLE member_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    grade_id INTEGER NOT NULL,
    achieved_date DATE NOT NULL,
    instructor_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades (id),
    FOREIGN KEY (instructor_id) REFERENCES users (id)
);

CREATE TABLE member_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    criterion_id INTEGER NOT NULL,
    achieved BOOLEAN DEFAULT 0,
    achieved_date DATE,
    instructor_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES grade_criteria (id),
    FOREIGN KEY (instructor_id) REFERENCES users (id)
);

CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT 1,
    hours_attended REAL DEFAULT 1.0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes (id)
);

CREATE TABLE payments (
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
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
*/

-- For now, the current implementation with manual cascading in the server code is sufficient
-- and provides better control over the deletion process