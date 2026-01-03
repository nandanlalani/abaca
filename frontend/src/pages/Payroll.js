import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Download, Eye, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import api from '../utils/api';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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
    fetchPayrolls();
  }, [selectedYear, selectedMonth]);

  const fetchPayrolls = async () => {
    try {
      let url = '/payroll/me';
      if (selectedYear && selectedMonth) {
        url += `?year=${selectedYear}&month=${selectedMonth}`;
      }
      
      const response = await api.get(url);
      if (response.data.success) {
        setPayrolls(response.data.payrolls);
      }
    } catch (error) {
      toast.error('Failed to fetch payroll data');
    } finally {
      setLoading(false);
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
      link.download = `Payslip_${monthName}_${payroll.year}_${payroll.employee_id || 'Employee'}.html`;
      
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
        toast.error('Access denied. You can only download your own payslips.');
      } else {
        toast.error('Failed to download payslip. Please try again.');
      }
    } finally {
      setDownloadingId(null);
    }
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

  const calculateGrossPayroll = () => {
    return payrolls.reduce((total, payroll) => total + (payroll.basic + payroll.hra + payroll.allowances), 0);
  };

  const calculateNetPayroll = () => {
    return payrolls.reduce((total, payroll) => total + payroll.net_pay, 0);
  };

  const calculateTotalDeductions = () => {
    return payrolls.reduce((total, payroll) => total + payroll.deductions, 0);
  };

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
      <div className="space-y-6" data-testid="payroll-page">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Payroll</h1>
          <div className="flex space-x-2">
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
        </div>

        {/* Payroll Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Gross Pay</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculateGrossPayroll())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Net Pay</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculateNetPayroll())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Deductions</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculateTotalDeductions())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pay Periods</p>
                  <p className="text-2xl font-bold">{payrolls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payroll History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>HRA</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.payroll_id}>
                    <TableCell className="font-medium">
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
                {payrolls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                Payroll Details - {selectedPayroll && getMonthName(selectedPayroll.month)} {selectedPayroll?.year}
              </DialogTitle>
            </DialogHeader>
            {selectedPayroll && (
              <div className="space-y-6">
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

export default Payroll;
