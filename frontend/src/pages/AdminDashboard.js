import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Users, Calendar, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    thisMonthPayroll: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('Component rendered with stats:', stats);

  useEffect(() => {
    console.log('Stats state updated:', stats);
  }, [stats]);

  useEffect(() => {
    // Add delay to prevent API call conflicts with other components
    const timer = setTimeout(() => {
      console.log('Current user from localStorage:', JSON.parse(localStorage.getItem('user') || '{}'));
      console.log('Access token exists:', !!localStorage.getItem('access_token'));
      fetchDashboardData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('=== DASHBOARD DEBUG START ===');
      console.log('Current user from localStorage:', JSON.parse(localStorage.getItem('user') || '{}'));
      console.log('Access token exists:', !!localStorage.getItem('access_token'));
      
      // Test authentication first
      console.log('0. Testing authentication...');
      const authTest = await api.get('/auth/me');
      console.log('Auth test response:', authTest.data);
      
      // Fetch employees
      console.log('1. Fetching employees...');
      const employeesRes = await api.get('/profiles/employees');
      console.log('Employees API response:', employeesRes.data);
      const totalEmployees = employeesRes.data.success ? employeesRes.data.employees.length : 0;
      console.log('Total employees calculated:', totalEmployees);

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      console.log('2. Fetching attendance for date:', today);
      const attendanceRes = await api.get(`/attendance?start_date=${today}&end_date=${today}`);
      console.log('Attendance API response:', attendanceRes.data);
      const presentToday = attendanceRes.data.success ? 
        attendanceRes.data.attendance.filter((a) => a.status === 'present').length : 0;
      console.log('Present today calculated:', presentToday);

      // Fetch pending leaves
      console.log('3. Fetching pending leaves...');
      const leavesRes = await api.get('/leaves?status=pending');
      console.log('Leaves API response:', leavesRes.data);
      const pendingLeaves = leavesRes.data.success ? leavesRes.data.leaves.length : 0;
      console.log('Pending leaves calculated:', pendingLeaves);
      if (leavesRes.data.success) {
        setRecentLeaves(leavesRes.data.leaves.slice(0, 5));
      }

      // Fetch payroll data (if available)
      let thisMonthPayroll = 0;
      try {
        console.log('4. Fetching payroll data...');
        const payrollRes = await api.get('/payroll');
        console.log('Payroll API response:', payrollRes.data);
        if (payrollRes.data.success && payrollRes.data.payrolls.length > 0) {
          // Get the most recent month's payroll instead of current month
          const payrolls = payrollRes.data.payrolls;
          const mostRecentPayroll = payrolls.reduce((latest, current) => {
            const latestDate = new Date(latest.year, latest.month - 1);
            const currentDate = new Date(current.year, current.month - 1);
            return currentDate > latestDate ? current : latest;
          });
          
          console.log('Most recent payroll month:', mostRecentPayroll.month, mostRecentPayroll.year);
          
          // Sum all payrolls for the most recent month
          thisMonthPayroll = payrolls
            .filter(p => p.month === mostRecentPayroll.month && p.year === mostRecentPayroll.year)
            .reduce((total, p) => total + (p.net_pay || 0), 0);
          
          console.log('Most recent month payroll calculated:', thisMonthPayroll);
        }
      } catch (payrollError) {
        console.log('Payroll error:', payrollError.message);
      }

      const newStats = {
        totalEmployees,
        presentToday,
        pendingLeaves,
        thisMonthPayroll,
      };
      
      console.log('5. Final stats to set:', newStats);
      setStats(newStats);
      console.log('6. Stats state after setting:', stats);
      console.log('=== DASHBOARD DEBUG END ===');
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to load dashboard data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: Calendar,
      color: 'text-green-500',
      trend: `${stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%`,
      trendUp: true,
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: FileText,
      color: 'text-orange-500',
      trend: stats.pendingLeaves > 5 ? 'High' : 'Normal',
      trendUp: false,
    },
    {
      title: 'Recent Payroll',
      value: `$${stats.thisMonthPayroll.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-500',
      trend: '+2%',
      trendUp: true,
    },
  ];

  console.log('Rendering with stats:', stats);
  console.log('Stat cards:', statCards);

  return (
    <Layout>
      <div className="space-y-6" data-testid="admin-dashboard">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your organization</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {stat.trendUp ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    )}
                    {stat.trend} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="leaves" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leaves" data-testid="tab-pending-leaves">Pending Leaves</TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">Recent Attendance</TabsTrigger>
            <TabsTrigger value="employees" data-testid="tab-employees">Employees</TabsTrigger>
          </TabsList>

          <TabsContent value="leaves">
            <Card>
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
                <CardDescription>Review and approve employee leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                {recentLeaves.length > 0 ? (
                  <div className="space-y-3">
                    {recentLeaves.map((leave) => (
                      <div key={leave.leave_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{leave.employee_name || leave.employee_id}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {leave.leave_type} - {new Date(leave.start_date).toLocaleDateString()} to{' '}
                            {new Date(leave.end_date).toLocaleDateString()}
                          </p>
                          {leave.remarks && (
                            <p className="text-sm text-muted-foreground mt-1">{leave.remarks}</p>
                          )}
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No pending leave requests</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Employee attendance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">Attendance data will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>Manage your workforce</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">Employee list will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
