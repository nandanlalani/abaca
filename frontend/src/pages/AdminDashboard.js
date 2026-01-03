import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Users, Calendar, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    thisMonthPayroll: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);

  console.log('Component rendered with stats:', stats);

  useEffect(() => {
    console.log('Stats state updated:', stats);
  }, [stats]);

  useEffect(() => {
    fetchDashboardData();
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

      // Fetch recent attendance (last 7 days)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const todayStr = today.toISOString().split('T')[0];
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      
      console.log('2. Fetching attendance for date range:', sevenDaysAgoStr, 'to', todayStr);
      const attendanceRes = await api.get(`/attendance?start_date=${sevenDaysAgoStr}&end_date=${todayStr}`);
      console.log('Attendance API response:', attendanceRes.data);
      
      // Calculate present today from the fetched data
      const presentToday = attendanceRes.data.success ? 
        attendanceRes.data.attendance.filter((a) => a.status === 'present' && a.date === todayStr).length : 0;
      console.log('Present today calculated:', presentToday);
      
      // Store recent attendance data for display with employee names
      if (attendanceRes.data.success && employeesRes.data.success) {
        const employeeMap = {};
        employeesRes.data.employees.forEach(emp => {
          employeeMap[emp.employee_id] = `${emp.first_name} ${emp.last_name}`;
        });
        
        const attendanceWithNames = attendanceRes.data.attendance.map(att => ({
          ...att,
          employee_name: employeeMap[att.employee_id] || att.employee_id
        }));
        
        // Sort by date descending and take the most recent 10 records
        const sortedAttendance = attendanceWithNames.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentAttendance(sortedAttendance.slice(0, 10));
      }

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
          const payrolls = payrollRes.data.payrolls;
          console.log('Total payroll records found:', payrolls.length);
          
          if (payrolls.length > 0) {
            // Group payrolls by month/year and find the most recent
            const payrollsByMonth = {};
            payrolls.forEach(p => {
              const key = `${p.year}-${p.month}`;
              if (!payrollsByMonth[key]) {
                payrollsByMonth[key] = [];
              }
              payrollsByMonth[key].push(p);
            });
            
            // Find the most recent month with data
            const monthKeys = Object.keys(payrollsByMonth).sort((a, b) => {
              const [yearA, monthA] = a.split('-').map(Number);
              const [yearB, monthB] = b.split('-').map(Number);
              const dateA = new Date(yearA, monthA - 1);
              const dateB = new Date(yearB, monthB - 1);
              return dateB - dateA; // Sort descending (most recent first)
            });
            
            if (monthKeys.length > 0) {
              const mostRecentKey = monthKeys[0];
              const [year, month] = mostRecentKey.split('-').map(Number);
              console.log('Most recent payroll month/year:', month, year);
              
              // Sum all payrolls for the most recent month
              thisMonthPayroll = payrollsByMonth[mostRecentKey]
                .reduce((total, p) => total + (p.net_pay || 0), 0);
              
              console.log('Most recent month payroll calculated:', thisMonthPayroll);
            }
          }
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
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-violet-100 text-violet-600',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: Calendar,
      color: 'bg-emerald-100 text-emerald-600',
      trend: `${stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%`,
      trendUp: true,
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: FileText,
      color: 'bg-amber-100 text-amber-600',
      trend: stats.pendingLeaves > 5 ? 'High' : 'Normal',
      trendUp: false,
    },
    {
      title: 'Recent Payroll',
      value: `₹${stats.thisMonthPayroll.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-rose-100 text-rose-600',
      trend: '+2%',
      trendUp: true,
    },
  ];

  return (
    <Layout>
      <div className="space-y-8" data-testid="admin-dashboard">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 mt-1">Manage your organization's workforce and operations.</p>
          </div>
          <div className="flex items-center space-x-3">
             <Badge variant="outline" className="px-3 py-1 bg-white shadow-sm border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                System Healthy
             </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all duration-300" data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color} transition-transform group-hover:rotate-6`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge className={`${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} border-none font-bold text-xs`}>
                      {stat.trend}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                    <div className="text-3xl font-black text-slate-900 mt-1">{stat.value}</div>
                  </div>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     Updated 2 mins ago
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
               <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Recent Activity</CardTitle>
                    <CardDescription>Stay updated with the latest requests and status</CardDescription>
                  </div>
                  <Tabs defaultValue="leaves" className="w-auto">
                    <TabsList className="bg-slate-200/50 rounded-xl p-1">
                      <TabsTrigger value="leaves" className="rounded-lg px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Leaves</TabsTrigger>
                      <TabsTrigger value="attendance" className="rounded-lg px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Attendance</TabsTrigger>
                    </TabsList>
                  </Tabs>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <Tabs defaultValue="leaves">
                 <TabsContent value="leaves" className="m-0 p-6">
                    {recentLeaves.length > 0 ? (
                      <div className="space-y-4">
                        {recentLeaves.map((leave) => (
                          <div key={leave.leave_id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                {leave.employee_name?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{leave.employee_name || leave.employee_id}</p>
                                <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
                                  {leave.leave_type} • {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                               <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Pending</Badge>
                               <span className="text-[10px] text-slate-400 mt-2 font-bold">Applied yesterday</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                         <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <FileText className="h-8 w-8 text-slate-300" />
                         </div>
                         <p className="text-slate-400 font-medium">No pending leave requests</p>
                      </div>
                    )}
                 </TabsContent>
                 <TabsContent value="attendance" className="m-0 p-6">
                    {recentAttendance.length > 0 ? (
                      <div className="space-y-4">
                        {recentAttendance.map((attendance) => (
                          <div key={`${attendance.employee_id}-${attendance.date}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                {attendance.employee_name?.charAt(0) || attendance.employee_id?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                                  {attendance.employee_name || attendance.employee_id}
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  {new Date(attendance.date).toLocaleDateString()} • 
                                  {attendance.check_in ? new Date(attendance.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Not checked in'}
                                  {attendance.check_out && ` - ${new Date(attendance.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                               <Badge className={`${
                                 attendance.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                 attendance.status === 'absent' ? 'bg-red-100 text-red-700' :
                                 attendance.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                 'bg-slate-100 text-slate-700'
                               } hover:bg-current border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                                 {attendance.status}
                               </Badge>
                               <span className="text-[10px] text-slate-400 mt-2 font-bold">
                                 {attendance.total_minutes ? `${Math.floor(attendance.total_minutes / 60)}h ${attendance.total_minutes % 60}m` : 'In progress'}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                         <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Calendar className="h-8 w-8 text-slate-300" />
                         </div>
                         <p className="text-slate-400 font-medium">No recent attendance records</p>
                      </div>
                    )}
                 </TabsContent>
               </Tabs>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
            <CardHeader>
               <CardTitle className="text-xl font-bold">Quick Insights</CardTitle>
               <CardDescription className="text-violet-100">Monthly overview at a glance</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                     <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">Payroll Efficiency</p>
                     <div className="flex items-end justify-between">
                        <div className="text-2xl font-black">98.2%</div>
                        <div className="text-emerald-300 text-xs font-bold flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> +1.2%</div>
                     </div>
                     <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: '98%' }} />
                     </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                     <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">Attendance Rate</p>
                     <div className="flex items-end justify-between">
                        <div className="text-2xl font-black">94.5%</div>
                        <div className="text-amber-300 text-xs font-bold flex items-center"><TrendingDown className="h-3 w-3 mr-1" /> -0.8%</div>
                     </div>
                     <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '94%' }} />
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
