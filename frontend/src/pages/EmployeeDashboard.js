import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, FileText, DollarSign, User, Clock, ArrowRight } from 'lucide-react';
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
      color: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Attendance',
      description: 'Track your attendance',
      icon: Calendar,
      link: '/attendance',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Leave Requests',
      description: 'Apply for leave',
      icon: FileText,
      link: '/leave',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Payroll',
      description: 'View salary details',
      icon: DollarSign,
      link: '/payroll',
      color: 'bg-rose-100 text-rose-600',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8" data-testid="employee-dashboard">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back, {profile?.first_name || 'Employee'}!</h1>
            <p className="text-slate-500 mt-1 font-medium">Employee ID: <span className="text-violet-600 font-bold">{user?.employee_id}</span></p>
          </div>
          <div className="flex items-center space-x-3">
             <Badge variant="outline" className="px-3 py-1 bg-white shadow-sm border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                Active Session
             </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="md:col-span-2 lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white" data-testid="attendance-card">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold text-slate-900">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                  <Clock className="h-5 w-5" />
                </div>
                <span>Today's Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {attendanceToday ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-violet-200 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Punch In</p>
                      <p className="text-2xl font-black text-slate-900">
                        {attendanceToday.check_in
                          ? new Date(attendanceToday.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-violet-200 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Punch Out</p>
                      <p className="text-2xl font-black text-slate-900">
                        {attendanceToday.check_out
                          ? new Date(attendanceToday.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-violet-50 rounded-2xl border border-violet-100">
                     <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold text-violet-900 uppercase tracking-tight">Status: <span className="capitalize">{attendanceToday.status.replace('_', ' ')}</span></span>
                     </div>
                     <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-violet-600 hover:bg-violet-100" asChild>
                        <Link to="/attendance">Details <ArrowRight className="ml-2 w-3 h-3" /></Link>
                     </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                   <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Calendar className="h-8 w-8 text-slate-300" />
                   </div>
                   <p className="text-slate-500 font-bold mb-6">No records found for today.</p>
                   <Button asChild className="rounded-xl font-bold px-8 shadow-lg shadow-violet-200">
                     <Link to="/attendance">Mark Attendance Now</Link>
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white" data-testid="leave-summary-card">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xl font-bold text-slate-900">Recent Leaves</CardTitle>
              <CardDescription className="font-medium text-slate-400 uppercase text-[10px] tracking-widest mt-1">Your latest status</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {recentLeaves.length > 0 ? (
                <div className="space-y-4">
                  {recentLeaves.map((leave) => (
                    <div key={leave.leave_id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-violet-100 transition-all cursor-pointer group">
                      <div>
                        <p className="text-sm font-black text-slate-900 capitalize group-hover:text-violet-600 transition-colors">{leave.leave_type}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                          {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={`border-none font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg ${
                          leave.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : leave.status === 'rejected'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50" asChild>
                    <Link to="/leave">View All Requests</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10">
                   <p className="text-slate-400 font-medium">No active requests.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 mb-6 uppercase text-sm tracking-widest text-slate-400">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.link} className="group">
                  <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden h-full group-hover:scale-[1.03] transition-all duration-300">
                    <CardHeader className="p-6">
                      <div className={`p-3 rounded-2xl w-fit ${action.color} mb-4 transition-transform group-hover:rotate-6 shadow-sm`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg font-black text-slate-900 group-hover:text-violet-600 transition-colors">{action.title}</CardTitle>
                      <CardDescription className="font-medium text-slate-500 mt-2">{action.description}</CardDescription>
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
