import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Search, Plus, Edit, Eye, DollarSign, TrendingUp, Users, Calendar, Download } from 'lucide-react';
import api from '../utils/api';

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    avgSalary: 0,
    processedThisMonth: 0
  });

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
    calculateStats();
  }, [selectedYear, selectedMonth]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/profiles/employees');
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchPayrolls = async () => {
    try {
      let url = '/payroll';
      if (selectedYear && selectedMonth) {
        url += `?year=${selectedYear}&month=${selectedMonth}`;
      }
      
      const response = await api.get(url);
      if (response.data.success) {
        setPayrolls(response.data.payrolls || []);
      }
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
      toast.error('Failed to fetch payroll data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const [employeesRes, payrollRes] = await Promise.all([
        api.get('/profiles/employees'),
        api.get(`/payroll?year=${selectedYear}&month=${selectedMonth}`)
      ]);

      const allEmployees = employeesRes.data.employees || [];
      const monthPayrolls = payrollRes.data.payrolls || [];
      
      const totalPayroll = monthPayrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);
      const avgSalary = allEmployees.length > 0 
        ? allEmployees.reduce((sum, emp) => sum + (emp.salary_structure?.basic || 0), 0) / allEmployees.length 
        : 0;

      setStats({
        totalEmployees: allEmployees.length,
        totalPayroll,
        avgSalary,
        processedThisMonth: monthPayrolls.length
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  const handleGeneratePayroll = async () => {
    setGenerateLoading(true);
    try {
      const response = await api.post('/payroll/generate', {
        year: selectedYear,
        month: selectedMonth
      });

      if (response.data.success) {
        toast.success('Payroll generated successfully');
        setIsGenerateDialogOpen(false);
        fetchPayrolls();
        calculateStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setIsDetailDialogOpen(true);
  };

  const handleDownloadSlip = async (payroll) => {
    try {
      setDownloadingId(payroll.payroll_id);
      toast.success('Generating payslip...');
      
      // Create a temporary link to download the file
      const response = await api.get(`/payroll/payslip/${payroll.payroll_id}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate a more descriptive filename
      const monthName = getMonthName(payroll.month);
      const employeeName = getEmployeeName(payroll.employee_id).replace(/\s+/g, '_');
      link.download = `Payslip_${employeeName}_${monthName}_${payroll.year}.html`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Payslip downloaded successfully! You can open it in your browser or print it.');
    } catch (error) {
      console.error('Download error:', error);
      if (error.response?.status === 404) {
        toast.error('Payroll record not found.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied.');
      } else {
        toast.error('Failed to download payslip. Please try again.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId || !employees || employees.length === 0) return employeeId || 'Unknown';
    const employee = employees.find(emp => emp.employee_id === employeeId);
    if (!employee) return employeeId;
    const firstName = employee.first_name || '';
    const lastName = employee.last_name || '';
    return `${firstName} ${lastName}`.trim() || employeeId;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getMonthName = (monthNum) => {
    return months.find(m => m.value === monthNum)?.label || '';
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    const employeeName = getEmployeeName(payroll.employee_id);
    const employeeNameLower = employeeName ? employeeName.toLowerCase() : '';
    const employeeIdLower = payroll.employee_id ? payroll.employee_id.toLowerCase() : '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return employeeNameLower.includes(searchTermLower) || 
           employeeIdLower.includes(searchTermLower);
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading payroll data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="admin-payroll-page">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Payroll Management</h1>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generate Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Month</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    This will generate payroll for {getMonthName(selectedMonth)} {selectedYear} for all employees.
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGeneratePayroll} disabled={generateLoading}>
                    {generateLoading ? 'Generating...' : 'Generate Payroll'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
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
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalPayroll)}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Avg Salary</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.avgSalary)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Processed</p>
                  <p className="text-2xl font-bold">{stats.processedThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
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
              
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>HRA</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.payroll_id}>
                    <TableCell className="font-medium">
                      {getEmployeeName(payroll.employee_id)}
                    </TableCell>
                    <TableCell>
                      {getMonthName(payroll.month)} {payroll.year}
                    </TableCell>
                    <TableCell>{formatCurrency(payroll.basic)}</TableCell>
                    <TableCell>{formatCurrency(payroll.hra)}</TableCell>
                    <TableCell>{formatCurrency(payroll.allowances)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(payroll.deductions)}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(payroll.net_pay)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(payroll)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSlip(payroll)}
                          disabled={downloadingId === payroll.payroll_id}
                        >
                          <Download className="w-4 h-4" />
                          {downloadingId === payroll.payroll_id && (
                            <span className="ml-1">...</span>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayrolls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No payroll records found for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payroll Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Payroll Details - {selectedPayroll && getEmployeeName(selectedPayroll.employee_id)}
              </DialogTitle>
            </DialogHeader>
            {selectedPayroll && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Employee</Label>
                    <p className="text-sm text-muted-foreground">
                      {getEmployeeName(selectedPayroll.employee_id)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Pay Period</Label>
                    <p className="text-sm text-muted-foreground">
                      {getMonthName(selectedPayroll.month)} {selectedPayroll.year}
                    </p>
                  </div>
                </div>

                {/* Earnings Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-700">Earnings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span>Basic Salary</span>
                      <span className="font-semibold">{formatCurrency(selectedPayroll.basic)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span>HRA</span>
                      <span className="font-semibold">{formatCurrency(selectedPayroll.hra)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span>Allowances</span>
                      <span className="font-semibold">{formatCurrency(selectedPayroll.allowances)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-100 rounded-lg border-2 border-green-200">
                      <span className="font-semibold">Gross Earnings</span>
                      <span className="font-bold">
                        {formatCurrency(selectedPayroll.basic + selectedPayroll.hra + selectedPayroll.allowances)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-700">Deductions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                      <span>Tax Deductions</span>
                      <span className="font-semibold">{formatCurrency(selectedPayroll.deductions * 0.7)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                      <span>Other Deductions</span>
                      <span className="font-semibold">{formatCurrency(selectedPayroll.deductions * 0.3)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-100 rounded-lg border-2 border-red-200">
                      <span className="font-semibold">Total Deductions</span>
                      <span className="font-bold">{formatCurrency(selectedPayroll.deductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay Section */}
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-700">Net Pay</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {formatCurrency(selectedPayroll.net_pay)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => handleDownloadSlip(selectedPayroll)}
                    disabled={downloadingId === selectedPayroll?.payroll_id}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingId === selectedPayroll?.payroll_id ? 'Generating...' : 'Download Payslip'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminPayroll;
