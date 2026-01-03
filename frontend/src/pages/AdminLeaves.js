import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Search, Eye, Check, X, Clock, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    try {
      let url = '/leaves';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const response = await api.get(url);
      if (response.data.success) {
        const leavesData = response.data.leaves || [];
        setLeaves(leavesData);
        
        // Calculate stats
        setStats({
          total: leavesData.length,
          pending: leavesData.filter(l => l.status === 'pending').length,
          approved: leavesData.filter(l => l.status === 'approved').length,
          rejected: leavesData.filter(l => l.status === 'rejected').length
        });
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

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

  const handleLeaveAction = async (leaveId, action, remarks = '') => {
    setActionLoading(true);
    try {
      const response = await api.put(`/leaves/${leaveId}`, {
        status: action,
        admin_remarks: remarks
      });

      if (response.data.success) {
        toast.success(`Leave ${action} successfully`);
        fetchLeaves();
        setIsDetailDialogOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} leave`);
    } finally {
      setActionLoading(false);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: Check },
      rejected: { color: 'bg-red-100 text-red-800', icon: X }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status?.toUpperCase()}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type) => {
    const typeConfig = {
      sick: 'bg-red-50 text-red-700',
      casual: 'bg-blue-50 text-blue-700',
      annual: 'bg-green-50 text-green-700',
      maternity: 'bg-pink-50 text-pink-700',
      paternity: 'bg-purple-50 text-purple-700'
    };
    
    return (
      <Badge className={typeConfig[type] || 'bg-gray-50 text-gray-700'}>
        {type?.replace('_', ' ').toUpperCase()}
      </Badge>
    );
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

  const formatDetailDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const filteredLeaves = leaves.filter(leave => {
    const employeeName = getEmployeeName(leave.employee_id);
    const employeeNameLower = employeeName ? employeeName.toLowerCase() : '';
    const employeeIdLower = leave.employee_id ? leave.employee_id.toLowerCase() : '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return employeeNameLower.includes(searchTermLower) || 
           employeeIdLower.includes(searchTermLower) ||
           (leave.leave_type && leave.leave_type.toLowerCase().includes(searchTermLower));
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading leave requests...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="admin-leaves-page">
        <h1 className="text-4xl font-bold tracking-tight">Leave Management</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees or leave type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => (
                  <TableRow key={leave.leave_id}>
                    <TableCell className="font-medium">
                      {getEmployeeName(leave.employee_id)}
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                    <TableCell>{formatDate(leave.start_date)}</TableCell>
                    <TableCell>{formatDate(leave.end_date)}</TableCell>
                    <TableCell>
                      {calculateDays(leave.start_date, leave.end_date)} day(s)
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>{formatDate(leave.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {leave.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleLeaveAction(leave.leave_id, 'approved')}
                              disabled={actionLoading}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleLeaveAction(leave.leave_id, 'rejected')}
                              disabled={actionLoading}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Leave Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Request Details</DialogTitle>
            </DialogHeader>
            {selectedLeave && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Employee</Label>
                    <p className="text-sm text-muted-foreground">
                      {getEmployeeName(selectedLeave.employee_id)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Leave Type</Label>
                    <div className="mt-1">
                      {getLeaveTypeBadge(selectedLeave.leave_type)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDetailDate(selectedLeave.start_date)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDetailDate(selectedLeave.end_date)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-sm text-muted-foreground">
                      {calculateDays(selectedLeave.start_date, selectedLeave.end_date)} day(s)
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedLeave.status)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Employee Remarks</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedLeave.remarks || 'No remarks provided'}
                  </p>
                </div>

                {selectedLeave.admin_remarks && (
                  <div>
                    <Label className="text-sm font-medium">Admin Remarks</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedLeave.admin_remarks}
                    </p>
                  </div>
                )}

                {/* Salary Deduction Section - Only show for sick leave */}
                {selectedLeave.leave_type === 'sick' && (
                  <div className="border-t pt-4">
                    <div className="flex items-center mb-3">
                      <DollarSign className="w-5 h-5 text-red-600 mr-2" />
                      <Label className="text-sm font-medium text-red-600">Salary Impact</Label>
                    </div>
                    
                    {selectedLeave.salary_deduction > 0 ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-red-800">Salary Deduction:</span>
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrency(selectedLeave.salary_deduction)}
                          </span>
                        </div>
                        {selectedLeave.deduction_reason && (
                          <p className="text-xs text-red-700 mt-2">
                            <strong>Reason:</strong> {selectedLeave.deduction_reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">
                            No salary deduction - within annual sick leave allowance
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedLeave.status === 'pending' && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleLeaveAction(selectedLeave.leave_id, 'rejected')}
                      disabled={actionLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleLeaveAction(selectedLeave.leave_id, 'approved')}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminLeaves;
