import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  useEffect(() => {
    fetchAttendanceData();
    fetchTodayAttendance();
  }, [dateRange]);

  const fetchAttendanceData = async () => {
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const response = await api.get(`/attendance/me?start_date=${startDate}&end_date=${endDate}`);
      if (response.data.success) {
        setAttendanceRecords(response.data.attendance);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get(`/attendance/me?start_date=${today}&end_date=${today}`);
      if (response.data.success && response.data.attendance.length > 0) {
        setTodayAttendance(response.data.attendance[0]);
      }
    } catch (error) {
      console.error('Failed to fetch today attendance');
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await api.post('/attendance/check-in');
      if (response.data.success) {
        toast.success('Checked in successfully');
        fetchTodayAttendance();
        fetchAttendanceData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await api.post('/attendance/check-out');
      if (response.data.success) {
        toast.success('Checked out successfully');
        fetchTodayAttendance();
        fetchAttendanceData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-out failed');
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

  const getCurrentTime = () => {
    return format(new Date(), 'HH:mm:ss');
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="space-y-6" data-testid="attendance-page">
        <h1 className="text-4xl font-bold tracking-tight">Attendance</h1>
        
        {/* Today's Attendance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today's Attendance</span>
              <div className="text-2xl font-mono">{currentTime}</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {todayAttendance?.check_in ? formatTime(todayAttendance.check_in) : '--:--'}
                </div>
                <div className="text-sm text-muted-foreground">Check In</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {todayAttendance?.check_out ? formatTime(todayAttendance.check_out) : '--:--'}
                </div>
                <div className="text-sm text-muted-foreground">Check Out</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(todayAttendance?.total_minutes)}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <Button 
                onClick={handleCheckIn} 
                disabled={todayAttendance?.check_in}
                data-testid="check-in-button"
                className="min-w-32"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {todayAttendance?.check_in ? 'Checked In' : 'Check In'}
              </Button>
              <Button 
                onClick={handleCheckOut} 
                variant="outline" 
                disabled={!todayAttendance?.check_in || todayAttendance?.check_out}
                data-testid="check-out-button"
                className="min-w-32"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {todayAttendance?.check_out ? 'Checked Out' : 'Check Out'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Attendance History</span>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.attendance_id}>
                    <TableCell className="font-medium">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>{formatTime(record.check_in)}</TableCell>
                    <TableCell>{formatTime(record.check_out)}</TableCell>
                    <TableCell>{formatDuration(record.total_minutes)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
                {attendanceRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No attendance records found for the selected period
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

export default Attendance;
