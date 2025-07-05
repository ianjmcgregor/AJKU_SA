const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../database/dojo.db');
const SCHEMA_PATH = path.join(__dirname, '../database/schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Read and execute schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
const statements = schema.split(';').filter(stmt => stmt.trim());

console.log('Setting up database...');

db.serialize(() => {
    // Execute schema statements
    statements.forEach(stmt => {
        if (stmt.trim()) {
            db.run(stmt, (err) => {
                if (err) {
                    console.error('Error executing statement:', err.message);
                }
            });
        }
    });

    // Insert sample data
    console.log('Adding sample data...');

    // Add default admin user
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR REPLACE INTO users (username, email, password_hash, role) 
            VALUES ('admin', 'admin@dojo.com', ?, 'admin')`, 
            [adminPassword]);

    // Add instructor user
    const instructorPassword = bcrypt.hashSync('instructor123', 10);
    db.run(`INSERT OR REPLACE INTO users (username, email, password_hash, role) 
            VALUES ('instructor', 'instructor@dojo.com', ?, 'instructor')`, 
            [instructorPassword]);

    // Add karate belt grades
    const grades = [
        { name: 'White Belt', color: 'white', level: 1, dan_level: 0, minimum_age: 0, minimum_training_hours: 0, description: 'Beginning level' },
        { name: 'Yellow Belt', color: 'yellow', level: 2, dan_level: 0, minimum_age: 0, minimum_training_hours: 40, description: 'Basic techniques' },
        { name: 'Orange Belt', color: 'orange', level: 3, dan_level: 0, minimum_age: 0, minimum_training_hours: 80, description: 'Intermediate basics' },
        { name: 'Green Belt', color: 'green', level: 4, dan_level: 0, minimum_age: 0, minimum_training_hours: 120, description: 'Advanced basics' },
        { name: 'Blue Belt', color: 'blue', level: 5, dan_level: 0, minimum_age: 0, minimum_training_hours: 160, description: 'Intermediate techniques' },
        { name: 'Brown Belt', color: 'brown', level: 6, dan_level: 0, minimum_age: 14, minimum_training_hours: 200, description: 'Advanced techniques' },
        { name: 'Black Belt 1st Dan', color: 'black', level: 7, dan_level: 1, minimum_age: 16, minimum_training_hours: 300, description: 'First degree black belt' },
        { name: 'Black Belt 2nd Dan', color: 'black', level: 8, dan_level: 2, minimum_age: 18, minimum_training_hours: 600, description: 'Second degree black belt' },
        { name: 'Black Belt 3rd Dan', color: 'black', level: 9, dan_level: 3, minimum_age: 21, minimum_training_hours: 1000, description: 'Third degree black belt' }
    ];

    grades.forEach(grade => {
        db.run(`INSERT OR REPLACE INTO grades (name, color, level, dan_level, minimum_age, minimum_training_hours, description) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [grade.name, grade.color, grade.level, grade.dan_level, grade.minimum_age, grade.minimum_training_hours, grade.description]);
    });

    // Add grade criteria for Yellow Belt (example)
    const yellowBeltCriteria = [
        { category: 'Basics', name: 'Front Kick (Mae Geri)', description: 'Execute 10 proper front kicks with each leg' },
        { category: 'Basics', name: 'Reverse Punch (Gyaku Zuki)', description: 'Execute 10 proper reverse punches with each arm' },
        { category: 'Basics', name: 'Blocks', description: 'Demonstrate upper, middle, and lower blocks' },
        { category: 'Kata', name: 'Heian Shodan', description: 'Perform the first kata with proper form and timing' },
        { category: 'Kumite', name: 'Basic Sparring', description: 'Demonstrate basic attack and defense combinations' },
        { category: 'Physical', name: 'Push-ups', description: 'Complete 10 push-ups with proper form' },
        { category: 'Physical', name: 'Sit-ups', description: 'Complete 20 sit-ups with proper form' }
    ];

    yellowBeltCriteria.forEach(criteria => {
        db.run(`INSERT INTO grade_criteria (grade_id, category, name, description) 
                VALUES (2, ?, ?, ?)`, 
                [criteria.category, criteria.name, criteria.description]);
    });

    // Add sample member
    db.run(`INSERT OR REPLACE INTO members (first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, join_date, membership_status) 
            VALUES ('John', 'Doe', '1990-01-01', 'male', '555-1234', 'john.doe@email.com', '123 Main St', 'Jane Doe', '555-5678', 'spouse', '2024-01-01', 'active')`);

    // Set John Doe's current grade to White Belt
    db.run(`INSERT INTO member_grades (member_id, grade_id, achieved_date, is_current) 
            VALUES (1, 1, '2024-01-01', TRUE)`);

    // Add sample class
    db.run(`INSERT INTO classes (name, description, instructor_id, date, start_time, end_time, max_capacity) 
            VALUES ('Beginner Class', 'Basic karate techniques for beginners', 2, '2024-01-15', '18:00', '19:00', 20)`);

    // Add sample attendance
    db.run(`INSERT INTO attendance (member_id, class_id, date, check_in_time, check_out_time, hours_attended) 
            VALUES (1, 1, '2024-01-15', '18:00', '19:00', 1.0)`);

    // Add sample payment
    db.run(`INSERT INTO payments (member_id, amount, payment_type, payment_method, payment_date, status, description) 
            VALUES (1, 100.00, 'monthly', 'card', '2024-01-01', 'paid', 'Monthly membership fee')`);

    console.log('Database setup complete!');
    console.log('Default admin credentials: admin@dojo.com / admin123');
    console.log('Default instructor credentials: instructor@dojo.com / instructor123');
});

db.close();