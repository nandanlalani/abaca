import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { Search, Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

const AdminAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    avgAttendance: 0
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceData();
    fetchTodayStats();
  }, [dateRange, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/profiles/employees');
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      if (!dateRange.from || !dateRange.to) {
        console.log('Date range not set, skipping fetch');
        return;
      }
      
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      let url = `/attendance?start_date=${startDate}&end_date=${endDate}`;
      if (selectedEmployee !== 'all') {
        url += `&employee_id=${selectedEmployee}`;
      }
      
      const response = await api.get(url);
      if (response.data.success) {
        setAttendanceRecords(response.data.attendance || []);
      } else {
        setAttendanceRecords([]);
        toast.error('Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Attendance fetch error:', error);
      setAttendanceRecords([]);
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [attendanceRes, employeesRes] = await Promise.all([
        api.get(`/attendance?start_date=${today}&end_date=${today}`),
        api.get('/profiles/employees')
      ]);

      const todayAttendance = attendanceRes.data.attendance || [];
      const allEmployees = employeesRes.data.employees || [];
      
      const presentToday = todayAttendance.filter(a => a.status === 'present').length;
      const totalEmployees = allEmployees.length;
      const absentToday = totalEmployees - presentToday;
      const avgAttendance = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

      setStats({
        totalEmployees,
        presentToday,
        absentToday,
        avgAttendance
      });
    } catch (error) {
      console.error('Failed to fetch today stats:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      absent: { color: 'bg-red-100 text-red-800', icon: XCircle },
      half_day: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      leave: { color: 'bg-blue-100 text-blue-800', icon: CalendarIcon }
    };
    
    const config = statusConfig[status] || statusConfig.absent;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status?.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId || !employees || employees.length === 0) return employeeId || 'Unknown';
    const employee = employees.find(emp => emp.employee_id === employeeId);
    if (!employee) return employeeId;
    const firstName = employee.first_name || '';
    const lastName = employee.last_name || '';
    return `${firstName} ${lastName}`.trim() || employeeId;
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const employeeName = getEmployeeName(record.employee_id);
    const employeeNameLower = employeeName ? employeeName.toLowerCase() : '';
    const employeeIdLower = record.employee_id ? record.employee_id.toLowerCase() : '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return employeeNameLower.includes(searchTermLower) || 
           employeeIdLower.includes(searchTermLower);
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading attendance data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="admin-attendance-page">
        <h1 className="text-4xl font-bold tracking-tight">Attendance Management</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                  <p className="text-2xl font-bold">{stats.presentToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                  <p className="text-2xl font-bold">{stats.absentToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.employee_id} value={employee.employee_id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange?.from && dateRange?.to 
                      ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                      : 'Select date range'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={`${record.employee_id}-${record.date}`}>
                    <TableCell className="font-medium">
                      {getEmployeeName(record.employee_id)}
                    </TableCell>
                    <TableCell>
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>{formatTime(record.check_in)}</TableCell>
                    <TableCell>{formatTime(record.check_out)}</TableCell>
                    <TableCell>{formatDuration(record.total_minutes)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
                {filteredRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No attendance records found for the selected criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminAttendance;
