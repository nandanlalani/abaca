import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { 
  Download, 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  FileText, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import api from '../utils/api';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportType, setReportType] = useState('leaves');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [reportData, setReportData] = useState({
    leaves: [],
    payroll: [],
    employees: []
  });
  const [analytics, setAnalytics] = useState({
    totalEmployees: 0,
    avgAttendanceRate: 0,
    totalLeaveRequests: 0,
    totalPayrollAmount: 0,
    departmentStats: [],
    monthlyTrends: []
  });

  useEffect(() => {
    fetchReportData();
    fetchAnalytics();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const endpoints = {
        leaves: `/leaves?start_date=${startDate}&end_date=${endDate}`,
        payroll: `/payroll?start_date=${startDate}&end_date=${endDate}`,
        employees: '/profiles/employees'
      };

      const response = await api.get(endpoints[reportType]);
      
      if (response.data.success) {
        setReportData(prev => ({
          ...prev,
          [reportType]: response.data[reportType] || response.data.employees || response.data.payrolls || response.data.leaves || []
        }));
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [employeesRes, leavesRes, payrollRes] = await Promise.all([
        api.get('/profiles/employees'),
        api.get('/leaves'),
        api.get('/payroll')
      ]);

      const employees = employeesRes.data.employees || [];
      const leaves = leavesRes.data.leaves || [];
      const payroll = payrollRes.data.payrolls || [];

      // Calculate analytics
      const totalEmployees = employees.length;
      const totalPayrollAmount = payroll.reduce((sum, p) => sum + (p.net_pay || 0), 0);

      // Department statistics
      const departmentStats = employees.reduce((acc, emp) => {
        const dept = emp.job_details?.department || 'Unknown';
        const existing = acc.find(d => d.department === dept);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ department: dept, count: 1 });
        }
        return acc;
      }, []);

      setAnalytics({
        totalEmployees,
        avgAttendanceRate: 0, // Removed attendance calculation
        totalLeaveRequests: leaves.length,
        totalPayrollAmount,
        departmentStats,
        monthlyTrends: [] // Could be calculated from historical data
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleExportReport = async () => {
    try {
      if (!dateRange?.from || !dateRange?.to) {
        toast.error('Please select a date range first');
        return;
      }

      setExportLoading(true);
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      let exportUrl = '';
      let filename = '';
      
      switch (reportType) {
        case 'leaves':
          exportUrl = `/reports/leaves/export?start_date=${startDate}&end_date=${endDate}`;
          filename = `leave_report_${startDate}_to_${endDate}.csv`;
          break;
        case 'payroll':
          // For payroll, we'll use month/year instead of date range
          const fromDate = new Date(dateRange.from);
          const toDate = new Date(dateRange.to);
          exportUrl = `/reports/payroll/export?month=${fromDate.getMonth() + 1}&year=${fromDate.getFullYear()}`;
          filename = `payroll_report_${fromDate.getMonth() + 1}_${fromDate.getFullYear()}.csv`;
          break;
        case 'employees':
          exportUrl = `/reports/employees/export`;
          filename = `employee_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
        default:
          toast.error('Invalid report type selected');
          return;
      }

      // Create a temporary link to download the file
      const response = await api.get(exportUrl, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800' },
      absent: { color: 'bg-red-100 text-red-800' },
      pending: { color: 'bg-yellow-100 text-yellow-800' },
      approved: { color: 'bg-green-100 text-green-800' },
      rejected: { color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={config.color}>
        {status?.toUpperCase()}
      </Badge>
    );
  };

  const renderReportTable = () => {
    const data = reportData[reportType] || [];

    if (reportType === 'leaves') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow key={index}>
                <TableCell>{record.employee_id}</TableCell>
                <TableCell className="capitalize">{record.leave_type}</TableCell>
                <TableCell>{formatDate(record.start_date)}</TableCell>
                <TableCell>{formatDate(record.end_date)}</TableCell>
                <TableCell>
                  {record.start_date && record.end_date 
                    ? Math.ceil((new Date(record.end_date) - new Date(record.start_date)) / (1000 * 60 * 60 * 24)) + 1
                    : 'N/A'
                  }
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (reportType === 'payroll') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Basic</TableHead>
              <TableHead>HRA</TableHead>
              <TableHead>Allowances</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow key={index}>
                <TableCell>{record.employee_id}</TableCell>
                <TableCell>{record.month}/{record.year}</TableCell>
                <TableCell>{formatCurrency(record.basic)}</TableCell>
                <TableCell>{formatCurrency(record.hra)}</TableCell>
                <TableCell>{formatCurrency(record.allowances)}</TableCell>
                <TableCell>{formatCurrency(record.deductions)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(record.net_pay)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (reportType === 'employees') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Joining Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow key={index}>
                <TableCell>{record.employee_id}</TableCell>
                <TableCell>{record.first_name} {record.last_name}</TableCell>
                <TableCell>{record.email}</TableCell>
                <TableCell>{record.job_details?.department || 'N/A'}</TableCell>
                <TableCell>{record.job_details?.title || 'N/A'}</TableCell>
                <TableCell>{formatDate(record.job_details?.joining_date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return <p className="text-center text-muted-foreground py-8">No data available</p>;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="reports-page">
        <h1 className="text-4xl font-bold tracking-tight">Reports & Analytics</h1>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{analytics.totalEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Leave Requests</p>
                  <p className="text-2xl font-bold">{analytics.totalLeaveRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalPayrollAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.departmentStats.map((dept, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{dept.count}</p>
                  <p className="text-sm text-muted-foreground">{dept.department}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Generate Reports
            </CardTitle>
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leaves">Leave Report</SelectItem>
                  <SelectItem value="payroll">Payroll Report</SelectItem>
                  <SelectItem value="employees">Employee Report</SelectItem>
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

              <Button onClick={handleExportReport} disabled={exportLoading}>
                <Download className="w-4 h-4 mr-2" />
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-lg">Loading report data...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {renderReportTable()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
