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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const employeesRes = await api.get('/employees');
      const totalEmployees = employeesRes.data.employees.length;

      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await api.get(`/attendance?start_date=${today}&end_date=${today}`);
      const presentToday = attendanceRes.data.attendance.filter((a) => a.status === 'present').length;

      const leavesRes = await api.get('/leaves?status=pending');
      const pendingLeaves = leavesRes.data.leaves.length;
      setRecentLeaves(leavesRes.data.leaves.slice(0, 5));

      setStats({
        totalEmployees,
        presentToday,
        pendingLeaves,
        thisMonthPayroll: 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
      title: 'Monthly Payroll',
      value: `$${stats.thisMonthPayroll.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-500',
      trend: '+2%',
      trendUp: true,
    },
  ];

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
