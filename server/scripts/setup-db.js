const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Database setup
const DB_PATH = path.join(__dirname, '../database/dojo.db');
const SCHEMA_PATH = path.join(__dirname, '../database/schema.sql');

// Remove existing database
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Existing database removed');
}

// Create new database
const db = new sqlite3.Database(DB_PATH);

// Read and execute schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

console.log('Creating database schema...');

db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating schema:', err);
        return;
    }
    
    console.log('Schema created successfully');
    
    // Insert sample data
    insertSampleData();
});

function insertSampleData() {
    console.log('Inserting sample data...');
    
    // Create users
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const instructorPassword = bcrypt.hashSync('instructor123', 10);
    
    db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, 
        ['admin@dojo.com', adminPassword, 'admin']);
    
    db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, 
        ['instructor@dojo.com', instructorPassword, 'instructor']);
    
    // Create dojo locations
    const dojos = [
        { name: 'Allendale Dojo', address: 'Allendale Community Centre, Allendale SA', phone: '08 8XXX XXXX', email: 'allendale@ajku.com.au' },
        { name: 'Millicent Dojo', address: 'Millicent Community Centre, Millicent SA', phone: '08 8XXX XXXX', email: 'millicent@ajku.com.au' },
        { name: 'Mount Gambier Dojo', address: 'Mount Gambier Community Centre, Mount Gambier SA', phone: '08 8XXX XXXX', email: 'mountgambier@ajku.com.au' }
    ];
    
    dojos.forEach(dojo => {
        db.run(`INSERT INTO dojos (name, address, phone, email, primary_instructor_id, active) VALUES (?, ?, ?, ?, ?, ?)`,
            [dojo.name, dojo.address, dojo.phone, dojo.email, 2, 1]); // instructor_id = 2
    });
    
    // Create grades (karate belts)
    const grades = [
        { name: 'White Belt', color: 'white', order_rank: 1, description: 'Beginner level' },
        { name: 'Yellow Belt', color: 'yellow', order_rank: 2, description: 'Basic techniques' },
        { name: 'Orange Belt', color: 'orange', order_rank: 3, description: 'Intermediate basics' },
        { name: 'Green Belt', color: 'green', order_rank: 4, description: 'Advanced basics' },
        { name: 'Blue Belt', color: 'blue', order_rank: 5, description: 'Intermediate level' },
        { name: 'Purple Belt', color: 'purple', order_rank: 6, description: 'Advanced intermediate' },
        { name: 'Brown Belt', color: 'brown', order_rank: 7, description: 'Advanced level' },
        { name: 'Black Belt 1st Dan', color: 'black', order_rank: 8, description: 'Expert level' },
        { name: 'Black Belt 2nd Dan', color: 'black', order_rank: 9, description: 'Advanced expert' },
        { name: 'Black Belt 3rd Dan', color: 'black', order_rank: 10, description: 'Master level' }
    ];
    
    grades.forEach(grade => {
        db.run(`INSERT INTO grades (name, color, order_rank, description) VALUES (?, ?, ?, ?)`,
            [grade.name, grade.color, grade.order_rank, grade.description]);
    });
    
    // Create grade criteria for Yellow Belt
    const yellowBeltCriteria = [
        'Basic stances (zenkutsu-dachi, kokutsu-dachi)',
        'Basic blocks (age-uke, soto-uke, uchi-uke, gedan-barai)',
        'Basic strikes (oi-zuki, gyaku-zuki, shuto-uchi)',
        'Basic kicks (mae-geri, yoko-geri-keage)',
        'Kata: Heian Shodan',
        'Basic kumite (5 step sparring)',
        'Etiquette and dojo rules'
    ];
    
    yellowBeltCriteria.forEach(criterion => {
        db.run(`INSERT INTO grade_criteria (grade_id, criterion, description) VALUES (?, ?, ?)`,
            [2, criterion, 'Required for Yellow Belt']); // grade_id 2 = Yellow Belt
    });
    
    // Create sample members with comprehensive data
    const sampleMembers = [
        {
            first_name: 'John',
            last_name: 'Doe',
            other_names: 'Michael',
            date_of_birth: '1990-05-15',
            gender: 'male',
            address: '123 Main Street, Anytown, AT 12345',
            phone_number: '555-0123',
            email: 'john.doe@email.com',
            guardian_name: null,
            guardian_phone: null,
            guardian_email: null,
            guardian_relationship: null,
            emergency_contact_name: 'Jane Doe',
            emergency_contact_phone: '555-0124',
            emergency_contact_relationship: 'Spouse',
            medical_conditions: 'None',
            special_needs: null,
            photo_permission: 1,
            social_media_permission: 1,
            notes: 'Regular attendee, shows good dedication',
            current_grade_id: 2,
            status: 'active'
        },
        {
            first_name: 'Emily',
            last_name: 'Smith',
            other_names: 'Rose',
            date_of_birth: '2010-03-22',
            gender: 'female',
            address: '456 Oak Avenue, Somewhere, ST 67890',
            phone_number: '555-0125',
            email: 'emily.smith@email.com',
            guardian_name: 'Sarah Smith',
            guardian_phone: '555-0126',
            guardian_email: 'sarah.smith@email.com',
            guardian_relationship: 'Mother',
            emergency_contact_name: 'David Smith',
            emergency_contact_phone: '555-0127',
            emergency_contact_relationship: 'Father',
            medical_conditions: 'Mild asthma',
            special_needs: 'Requires inhaler nearby during training',
            photo_permission: 1,
            social_media_permission: 0,
            notes: 'Young student, very enthusiastic',
            current_grade_id: 1,
            status: 'active'
        },
        {
            first_name: 'Robert',
            last_name: 'Johnson',
            other_names: 'William',
            date_of_birth: '1985-11-08',
            gender: 'male',
            address: '789 Pine Street, Elsewhere, ET 11111',
            phone_number: '555-0128',
            email: 'rob.johnson@email.com',
            guardian_name: null,
            guardian_phone: null,
            guardian_email: null,
            guardian_relationship: null,
            emergency_contact_name: 'Lisa Johnson',
            emergency_contact_phone: '555-0129',
            emergency_contact_relationship: 'Wife',
            medical_conditions: 'Previous knee injury - right knee',
            special_needs: null,
            photo_permission: 1,
            social_media_permission: 1,
            notes: 'Experienced student, helps with beginners',
            current_grade_id: 5,
            status: 'active'
        },
        {
            first_name: 'Sarah',
            last_name: 'Wilson',
            other_names: null,
            date_of_birth: '2008-07-12',
            gender: 'female',
            address: '321 Elm Drive, Newtown, NT 22222',
            phone_number: '555-0130',
            email: null,
            guardian_name: 'Mark Wilson',
            guardian_phone: '555-0131',
            guardian_email: 'mark.wilson@email.com',
            guardian_relationship: 'Father',
            emergency_contact_name: 'Jennifer Wilson',
            emergency_contact_phone: '555-0132',
            emergency_contact_relationship: 'Mother',
            medical_conditions: 'None',
            special_needs: null,
            photo_permission: 0,
            social_media_permission: 0,
            notes: 'Shy initially but making good progress',
            current_grade_id: 3,
            status: 'active'
        }
    ];
    
    sampleMembers.forEach(member => {
        db.run(`
            INSERT INTO members (
                first_name, last_name, other_names, date_of_birth, gender,
                address, phone_number, email, guardian_name, guardian_phone,
                guardian_email, guardian_relationship, emergency_contact_name,
                emergency_contact_phone, emergency_contact_relationship,
                medical_conditions, special_needs, photo_permission,
                social_media_permission, notes, current_grade_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            member.first_name, member.last_name, member.other_names,
            member.date_of_birth, member.gender, member.address,
            member.phone_number, member.email, member.guardian_name,
            member.guardian_phone, member.guardian_email, member.guardian_relationship,
            member.emergency_contact_name, member.emergency_contact_phone,
            member.emergency_contact_relationship, member.medical_conditions,
            member.special_needs, member.photo_permission, member.social_media_permission,
            member.notes, member.current_grade_id, member.status
        ]);
    });
    
    // Create sample classes
    db.run(`INSERT INTO classes (name, description, instructor_id, day_of_week, start_time, end_time, max_participants) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Beginner Karate', 'Basic karate for beginners', 2, 'Monday', '18:00', '19:00', 20]);
    
    db.run(`INSERT INTO classes (name, description, instructor_id, day_of_week, start_time, end_time, max_participants) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Advanced Karate', 'Advanced techniques and sparring', 2, 'Wednesday', '19:00', '20:30', 15]);
    
    db.run(`INSERT INTO classes (name, description, instructor_id, day_of_week, start_time, end_time, max_participants) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Kids Karate', 'Karate for children under 12', 2, 'Saturday', '10:00', '11:00', 12]);
    
    // Create sample attendance records
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    db.run(`INSERT INTO attendance (member_id, class_id, date, present, hours_attended, notes) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 1, lastWeek.toISOString().split('T')[0], 1, 1.0, 'Good participation']);
    
    db.run(`INSERT INTO attendance (member_id, class_id, date, present, hours_attended, notes) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [2, 3, lastWeek.toISOString().split('T')[0], 1, 1.0, 'Excellent technique']);
    
    // Create sample payments
    db.run(`INSERT INTO payments (member_id, amount, payment_type, payment_method, status, due_date, paid_date, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 75.00, 'membership', 'card', 'completed', '2024-01-01', '2024-01-01', 'Monthly membership fee']);
    
    db.run(`INSERT INTO payments (member_id, amount, payment_type, payment_method, status, due_date, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [2, 50.00, 'membership', 'cash', 'pending', '2024-02-01', 'Monthly membership fee (child rate)']);
    
    console.log('Sample data inserted successfully');
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database setup completed successfully!');
            console.log('You can now login with:');
            console.log('Admin: admin@dojo.com / admin123');
            console.log('Instructor: instructor@dojo.com / instructor123');
        }
    });
}