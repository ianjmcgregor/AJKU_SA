# Attendance Tracking System Guide

## Overview

The Karate Dojo Attendance Tracking System provides comprehensive attendance management with three main interfaces:

1. **Live Tracking** - Real-time attendance during classes
2. **Back Dating** - Record attendance for past dates
3. **Manual Adjustment** - Modify existing attendance records
4. **History & Analytics** - View and export attendance data

## Features

### 🎯 Core Functionality

- **Variable Training Durations**: Support for 45 minutes (junior), 1 hour, and 1.5 hour classes
- **Real-time Updates**: Live check-in/check-out during classes
- **Audit Trail**: Complete tracking of all attendance changes
- **Flexible Status Tracking**: Present, Absent, Late, Left Early, Excused
- **Export Capabilities**: CSV export for reporting and analysis

### 📊 Attendance Types

1. **Regular** - Standard attendance recording
2. **Backdated** - Attendance recorded after the fact
3. **Manual Adjustment** - Modified by administrators
4. **Live Update** - Real-time session attendance

## Interface Guide

### 1. Live Tracking

**Purpose**: Record attendance in real-time during classes

**How to Use**:
1. Select a class and date
2. Click "Start Session" to begin live tracking
3. Check students in/out as they arrive/leave
4. Use "End Session" to stop tracking
5. Use "Finalize" to save attendance to permanent records

**Features**:
- Real-time check-in/check-out
- Visual status indicators
- Session management
- Automatic time tracking

### 2. Back Dating

**Purpose**: Record attendance for past dates when it was missed

**How to Use**:
1. Select class and past date
2. Provide reason for backdating
3. Select members to record attendance for
4. Set individual attendance details (status, hours, times)
5. Submit to create attendance records

**Features**:
- Detailed time tracking (check-in/check-out)
- Individual member customization
- Reason tracking for audit purposes
- Flexible hour calculations

### 3. Manual Adjustment

**Purpose**: Modify existing attendance records

**How to Use**:
1. Search for existing attendance records by class and date
2. Click "Edit" on any record
3. Modify status, hours, times, or notes
4. Provide reason for adjustment
5. Save changes

**Features**:
- Full audit trail of changes
- Change detection and warnings
- Comprehensive editing options
- Reason tracking

### 4. History & Analytics

**Purpose**: View, filter, and export attendance data

**How to Use**:
1. Apply filters (member, class, date range, status, type)
2. View statistics and attendance records
3. Export data to CSV for external analysis
4. Clear filters to reset view

**Features**:
- Advanced filtering options
- Statistical summaries
- CSV export functionality
- Comprehensive data view

## Database Schema

### Enhanced Tables

#### `classes` Table
- Added `duration_hours` for variable class lengths
- Added `class_type` (junior, regular, senior, advanced, special)
- Added `dojo_id` for multi-location support
- Added `active` status

#### `attendance` Table
- Enhanced with `check_in_time` and `check_out_time`
- Added `status` field (present, absent, late, left_early, excused)
- Added `attendance_type` for tracking how attendance was recorded
- Added `adjusted_by` and `adjustment_reason` for audit trail
- Added `updated_at` timestamp

#### New Tables

##### `attendance_sessions`
- Tracks live attendance sessions
- Links to classes and instructors
- Session status management

##### `live_attendance`
- Real-time attendance during sessions
- Check-in/check-out tracking
- Session-based organization

## API Endpoints

### Attendance Management

#### GET `/api/attendance`
- List attendance records with filtering
- Supports member_id, class_id, date_from, date_to, status, attendance_type

#### GET `/api/attendance/class/:class_id/date/:date`
- Get attendance for specific class and date
- Returns all members with their attendance status

#### POST `/api/attendance`
- Record regular attendance
- Validates against existing records

#### POST `/api/attendance/backdate`
- Record backdated attendance
- Requires adjustment reason

#### PUT `/api/attendance/:id`
- Manual adjustment of existing records
- Creates audit trail

### Live Session Management

#### POST `/api/attendance/sessions`
- Start a live attendance session

#### PUT `/api/attendance/sessions/:id/end`
- End a live session

#### POST `/api/attendance/live`
- Check in/out members during live session

#### GET `/api/attendance/sessions/:id/live`
- Get live attendance for a session

#### POST `/api/attendance/sessions/:id/finalize`
- Convert live attendance to permanent records

### Class Management

#### GET `/api/classes`
- List classes with filtering options

#### GET `/api/classes/:id`
- Get specific class details

#### POST `/api/classes`
- Create new class with enhanced fields

## Training Duration Support

The system supports variable training durations as requested:

- **Junior Classes**: 45 minutes (0.75 hours)
- **Regular Classes**: 1 hour (1.0 hours)
- **Advanced Classes**: 1.5 hours

### Implementation Details

1. **Class Configuration**: Each class has a `duration_hours` field
2. **Automatic Calculation**: System uses class duration when hours not specified
3. **Manual Override**: Instructors can specify custom hours when needed
4. **Time Tracking**: Check-in/check-out times for precise duration calculation

## Security & Permissions

### Role-Based Access

- **Admin**: Full access to all features
- **Instructor**: Can record and adjust attendance
- **Member**: View-only access to their own attendance

### Audit Trail

- All attendance changes are tracked
- Reason required for backdating and adjustments
- User ID recorded for all modifications
- Timestamps for creation and updates

## Usage Examples

### Scenario 1: Regular Class Attendance
1. Instructor starts live session
2. Students check in as they arrive
3. Students check out if they leave early
4. Instructor finalizes session
5. Attendance automatically saved to permanent records

### Scenario 2: Missed Attendance
1. Instructor realizes attendance wasn't recorded
2. Uses backdating interface
3. Selects class and past date
4. Provides reason: "Forgot to record attendance"
5. Records attendance for all present students

### Scenario 3: Correction Needed
1. Student reports they were marked absent but were present
2. Administrator searches for the record
3. Uses manual adjustment to change status
4. Provides reason: "Student was present but not recorded"
5. System creates audit trail of the change

## Best Practices

### For Instructors
- Start live sessions before class begins
- Check students in as they arrive
- End sessions promptly after class
- Use backdating for missed recordings
- Provide clear reasons for adjustments

### For Administrators
- Review attendance regularly
- Use manual adjustments sparingly
- Maintain clear audit trails
- Export data for external analysis
- Monitor attendance patterns

### Data Management
- Regular backups of attendance data
- Export important reports
- Monitor system usage
- Review audit trails periodically

## Troubleshooting

### Common Issues

1. **Session Won't Start**
   - Ensure class is selected
   - Check date is not in the future
   - Verify user has instructor permissions

2. **Can't Check In Student**
   - Ensure live session is active
   - Check if student is already checked in
   - Verify student is in the class roster

3. **Backdating Fails**
   - Provide a reason for backdating
   - Ensure date is not in the future
   - Check for existing attendance records

4. **Export Issues**
   - Ensure there are records to export
   - Check browser download settings
   - Verify sufficient data for export

## Future Enhancements

### Planned Features
- Mobile app for check-in/check-out
- QR code scanning for attendance
- Integration with payment systems
- Advanced analytics and reporting
- Email notifications for missed classes
- Bulk attendance operations

### Technical Improvements
- Real-time notifications
- Offline capability
- Advanced search and filtering
- Custom report generation
- API rate limiting
- Performance optimizations

## Support

For technical support or questions about the attendance system:

1. Check this guide first
2. Review the API documentation
3. Contact system administrator
4. Check error logs for specific issues

---

*This attendance system is designed to be flexible, secure, and easy to use while maintaining comprehensive audit trails for all attendance-related activities.*