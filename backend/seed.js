const mongoose = require('mongoose');
const { User, Profile, Attendance, Leave } = require('./models');
const { hashPassword } = require('./utils/auth');
const { format, subDays } = require('date-fns');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Drop collections to avoid index conflicts
    try {
      await mongoose.connection.db.dropCollection('users');
      await mongoose.connection.db.dropCollection('profiles');
      await mongoose.connection.db.dropCollection('attendances');
      await mongoose.connection.db.dropCollection('leaves');
      console.log('Dropped existing collections');
    } catch (error) {
      console.log('Collections may not exist, continuing...');
    }

    // Create admin user
    const adminPassword = await hashPassword('Admin123');
    const adminUser = new User({
      employee_id: 'ADMIN001',
      email: 'admin@dayflow.com',
      password_hash: adminPassword,
      role: 'admin',
      is_verified: true
    });
    await adminUser.save();

    // Create admin profile
    const adminProfile = new Profile({
      user_id: adminUser.user_id,
      employee_id: adminUser.employee_id,
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1234567890',
      address: '123 Admin Street, Admin City',
      job_details: {
        title: 'System Administrator',
        department: 'IT',
        joining_date: new Date('2024-01-01'),
        employment_type: 'full-time'
      },
      salary_structure: {
        basic: 80000,
        hra: 16000,
        allowances: 4000,
        deductions: 2000
      },
      emergency_contact: {
        name: 'Emergency Contact',
        relationship: 'Spouse',
        phone: '+1234567891'
      }
    });
    await adminProfile.save();

    // Create HR user
    const hrPassword = await hashPassword('HR123');
    const hrUser = new User({
      employee_id: 'HR001',
      email: 'hr@dayflow.com',
      password_hash: hrPassword,
      role: 'hr',
      is_verified: true
    });
    await hrUser.save();

    // Create HR profile
    const hrProfile = new Profile({
      user_id: hrUser.user_id,
      employee_id: hrUser.employee_id,
      first_name: 'HR',
      last_name: 'Manager',
      phone: '+1234567892',
      address: '456 HR Avenue, HR City',
      job_details: {
        title: 'HR Manager',
        department: 'Human Resources',
        joining_date: new Date('2024-01-15'),
        employment_type: 'full-time'
      },
      salary_structure: {
        basic: 70000,
        hra: 14000,
        allowances: 3500,
        deductions: 1500
      },
      emergency_contact: {
        name: 'HR Emergency',
        relationship: 'Parent',
        phone: '+1234567893'
      }
    });
    await hrProfile.save();

    // Create employee user
    const employeePassword = await hashPassword('Employee123');
    const employeeUser = new User({
      employee_id: 'EMP001',
      email: 'john.doe@dayflow.com',
      password_hash: employeePassword,
      role: 'employee',
      is_verified: true
    });
    await employeeUser.save();

    // Create employee profile
    const employeeProfile = new Profile({
      user_id: employeeUser.user_id,
      employee_id: employeeUser.employee_id,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567894',
      address: '789 Employee Lane, Employee City',
      job_details: {
        title: 'Software Developer',
        department: 'Engineering',
        joining_date: new Date('2024-02-01'),
        employment_type: 'full-time'
      },
      salary_structure: {
        basic: 60000,
        hra: 12000,
        allowances: 3000,
        deductions: 1000
      },
      emergency_contact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1234567895'
      }
    });
    await employeeProfile.save();

    // Create sample attendance data for the last 30 days
    const employees = [
      { employee_id: 'ADMIN001', user_id: adminUser.user_id },
      { employee_id: 'HR001', user_id: hrUser.user_id },
      { employee_id: 'EMP001', user_id: employeeUser.user_id }
    ];

    const attendanceRecords = [];
    
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      
      for (const emp of employees) {
        // Skip some days randomly to simulate absences
        if (Math.random() > 0.85) continue;
        
        const checkInHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkOutHour = 17 + Math.floor(Math.random() * 2); // 5-6 PM
        const checkOutMinute = Math.floor(Math.random() * 60);
        
        const checkInTime = new Date(`${date}T${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}:00`);
        const checkOutTime = new Date(`${date}T${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}:00`);
        
        const totalMinutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
        
        const attendance = new Attendance({
          employee_id: emp.employee_id,
          user_id: emp.user_id,
          date: date,
          check_in: checkInTime,
          check_out: checkOutTime,
          total_minutes: totalMinutes,
          status: 'present',
          created_by: emp.user_id
        });
        
        attendanceRecords.push(attendance);
      }
    }
    
    await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // Create sample leave requests
    const leaveTypes = ['sick', 'casual', 'annual', 'maternity', 'paternity'];
    const leaveStatuses = ['pending', 'approved', 'rejected'];
    const leaveRecords = [];

    for (const emp of employees) {
      // Create 3-5 leave requests per employee
      const numLeaves = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numLeaves; i++) {
        const startDate = subDays(new Date(), Math.floor(Math.random() * 60)); // Random date in last 60 days
        const duration = 1 + Math.floor(Math.random() * 5); // 1-5 days
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        
        const leave = new Leave({
          employee_id: emp.employee_id,
          user_id: emp.user_id,
          leave_type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          status: leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)],
          remarks: `Sample leave request for ${duration} day(s)`,
          created_by: emp.user_id
        });
        
        leaveRecords.push(leave);
      }
    }
    
    await Leave.insertMany(leaveRecords);
    console.log(`✅ Created ${leaveRecords.length} leave requests`);

    console.log('✅ Demo users created successfully:');
    console.log('Admin: admin@dayflow.com / Admin123');
    console.log('HR: hr@dayflow.com / HR123');
    console.log('Employee: john.doe@dayflow.com / Employee123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();