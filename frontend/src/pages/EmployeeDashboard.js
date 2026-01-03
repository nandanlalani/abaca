import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, FileText, DollarSign, User, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const EmployeeDashboard = () => {
  const { user, profile } = useAuth();
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await api.get(`/attendance/me?start_date=${today}&end_date=${today}`);
      setAttendanceToday(attendanceRes.data.attendance[0] || null);

      const leavesRes = await api.get('/leaves/me');
      setRecentLeaves(leavesRes.data.leaves.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Profile',
      description: 'View and edit your profile',
      icon: User,
      link: '/profile',
      color: 'text-blue-500',
    },
    {
      title: 'Attendance',
      description: 'Track your attendance',
      icon: Calendar,
      link: '/attendance',
      color: 'text-green-500',
    },
    {
      title: 'Leave Requests',
      description: 'Apply for leave',
      icon: FileText,
      link: '/leave',
      color: 'text-orange-500',
    },
    {
      title: 'Payroll',
      description: 'View salary details',
      icon: DollarSign,
      link: '/payroll',
      color: 'text-purple-500',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="employee-dashboard">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome, {profile?.first_name || 'Employee'}!</h1>
          <p className="text-muted-foreground mt-2">Employee ID: {user?.employee_id}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-6">
          <Card className="md:col-span-8 lg:col-span-8" data-testid="attendance-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Today's Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceToday ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="text-lg font-semibold">
                        {attendanceToday.check_in
                          ? new Date(attendanceToday.check_in).toLocaleTimeString()
                          : 'Not checked in'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="text-lg font-semibold">
                        {attendanceToday.check_out
                          ? new Date(attendanceToday.check_out).toLocaleTimeString()
                          : 'Not checked out'}
                      </p>
                    </div>
                    <Badge
                      variant={attendanceToday.status === 'present' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {attendanceToday.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/attendance">View Attendance History</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No attendance record for today</p>
                  <Button asChild>
                    <Link to="/attendance">Go to Attendance</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-8 lg:col-span-4" data-testid="leave-summary-card">
            <CardHeader>
              <CardTitle>Recent Leaves</CardTitle>
              <CardDescription>Your latest leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLeaves.length > 0 ? (
                <div className="space-y-3">
                  {recentLeaves.map((leave) => (
                    <div key={leave.leave_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium capitalize">{leave.leave_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(leave.start_date).toLocaleDateString()} -{' '}
                          {new Date(leave.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          leave.status === 'approved'
                            ? 'default'
                            : leave.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="capitalize"
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/leave">View All Leaves</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No leave requests</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.link}>
                  <Card
                    className="hover:shadow-md transition-shadow duration-200 cursor-pointer h-full"
                    data-testid={`quick-action-${action.title.toLowerCase()}`}
                  >
                    <CardHeader>
                      <Icon className={`h-8 w-8 ${action.color}`} />
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;
