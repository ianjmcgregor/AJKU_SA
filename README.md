# Karate Dojo Membership Management System

A comprehensive web application for managing karate dojo memberships, attendance tracking, grade progression, and payment management. Built with modern web technologies and designed for both online and offline use.

## Features

### Core Features
- **Member Management**: Complete member profiles with personal information, emergency contacts, and medical conditions
- **Attendance Tracking**: Record and monitor student attendance for classes and training sessions
- **Grade Progression**: Track student progress against belt requirements and criteria
- **Payment Management**: Handle membership fees, grading fees, and other payments
- **Class Scheduling**: Manage classes, instructors, and capacity
- **Dashboard**: Real-time statistics and overview of dojo operations

### Technical Features
- **Role-based Access Control**: Admin, Instructor, and Member roles with appropriate permissions
- **Offline Capability**: Progressive Web App (PWA) with offline data entry and sync
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Sync**: Automatic data synchronization when connection is restored
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database (easily switchable to PostgreSQL for production)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express-validator** for input validation

### Frontend
- **React 18** with hooks and modern patterns
- **Vite** for fast development and building
- **Tailwind CSS** for styling and responsive design
- **React Router** for navigation
- **Axios** for API communication
- **React Hot Toast** for notifications

### Offline Features
- **Service Worker** for caching and offline functionality
- **IndexedDB** for local data storage
- **Background Sync** for data synchronization

## Quick Start

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd karate-dojo-membership
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up the database**
   ```bash
   npm run setup:db
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Default Login Credentials

- **Admin**: admin@dojo.com / admin123
- **Instructor**: instructor@dojo.com / instructor123

## Database Schema

The application uses a comprehensive database schema with the following main tables:

- **users**: Authentication and user roles
- **members**: Student/member information
- **grades**: Belt/grade definitions and requirements
- **grade_criteria**: Specific requirements for each grade
- **member_grades**: Current and historical grades for members
- **member_progress**: Progress tracking against grade criteria
- **classes**: Class schedules and information
- **attendance**: Attendance records
- **payments**: Payment tracking and history
- **sync_log**: Offline synchronization tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Members
- `GET /api/members` - List members
- `GET /api/members/:id` - Get member details
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Record attendance

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class

### Grades
- `GET /api/grades` - List all grades/belts
- `GET /api/grades/:id/criteria` - Get criteria for specific grade

### Progress Tracking
- `GET /api/members/:id/progress` - Get member progress
- `POST /api/members/:id/progress` - Update member progress

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Offline Sync
- `POST /api/sync/upload` - Upload offline data for synchronization

## User Roles and Permissions

### Admin
- Full access to all features
- User management
- System configuration
- All member and class management functions

### Instructor
- Member management (add, edit, view)
- Attendance tracking
- Grade progression tracking
- Payment management
- Class management
- Dashboard access

### Member
- View personal dashboard
- View grade requirements
- Limited access to personal information

## Offline Functionality

The application supports offline data entry with automatic synchronization:

1. **Automatic Detection**: App detects when offline/online
2. **Local Storage**: Data entered offline is stored locally
3. **Visual Indicators**: Clear indication of offline status and pending sync items
4. **Automatic Sync**: Data syncs automatically when connection is restored
5. **Manual Sync**: Users can manually trigger synchronization

## Development

### Project Structure
```
karate-dojo-membership/
├── server/                 # Backend API
│   ├── database/          # Database schema and setup
│   ├── scripts/           # Database setup scripts
│   └── index.js           # Main server file
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── main.jsx       # App entry point
│   ├── public/            # Static assets
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Set up database with sample data
npm run setup:db

# Start development servers (both frontend and backend)
npm run dev

# Start only backend server
npm run server:dev

# Start only frontend server
npm run client:dev

# Build frontend for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
DB_PATH=./server/database/dojo.db
```

## Deployment

### Production Deployment

1. **Set environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-secure-production-secret
   ```

2. **Build the frontend**
   ```bash
   npm run build
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Database Migration (PostgreSQL)

For production, consider migrating from SQLite to PostgreSQL:

1. Install PostgreSQL and create a database
2. Update connection string in environment variables
3. Modify database connection code in `server/index.js`
4. Run database setup with PostgreSQL

## Future Enhancements

- **Mobile App**: React Native or Flutter mobile application
- **Advanced Reporting**: Detailed analytics and reports
- **Competition Management**: Tournament and competition tracking
- **Inventory Management**: Equipment and uniform tracking
- **Communication System**: Messaging and announcements
- **Online Payments**: Integration with payment gateways
- **Video Integration**: Technique videos and online classes
- **Multi-Dojo Support**: Management of multiple dojo locations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for the martial arts community**