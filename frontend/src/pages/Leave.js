import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Eye, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [sickLeaveUsage, setSickLeaveUsage] = useState({
    allowance: 12,
    taken: 0,
    remaining: 12
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: null,
    end_date: null,
    remarks: ''
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchLeaves();
      await fetchLeaveBalance();
      await fetchSickLeaveUsage();
    };
    loadData();
  }, []);

  const fetchSickLeaveUsage = async () => {
    try {
      // Get current year's approved sick leaves
      const currentYear = new Date().getFullYear();
      const response = await api.get('/leaves/me');
      
      if (response.data.success) {
        const allLeaves = response.data.leaves;
        const approvedSickLeaves = allLeaves.filter(leave => 
          leave.leave_type === 'sick' && 
          leave.status === 'approved' &&
          new Date(leave.start_date).getFullYear() === currentYear
        );

        const takenDays = approvedSickLeaves.reduce((total, leave) => {
          return total + calculateDays(leave.start_date, leave.end_date);
        }, 0);

        // Use the allowance from leaveBalance state, fallback to 12
        const allowance = leaveBalance.sick || 12;
        setSickLeaveUsage({
          allowance,
          taken: takenDays,
          remaining: Math.max(0, allowance - takenDays)
        });
      }
    } catch (error) {
      console.error('Failed to fetch sick leave usage:', error);
      // Set default values
      const allowance = leaveBalance.sick || 12;
      setSickLeaveUsage({
        allowance,
        taken: 0,
        remaining: allowance
      });
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves/me');
      if (response.data.success) {
        setLeaves(response.data.leaves);
      }
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await api.get('/profiles/leave-balance');
      if (response.data.success) {
        setLeaveBalance(response.data.balance);
        // Update sick leave usage with the correct allowance
        setSickLeaveUsage(prev => ({
          ...prev,
          allowance: response.data.balance.sick || 12
        }));
      }
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
      // Set default balance if API fails
      setLeaveBalance({
        sick: 12,
        casual: 12,
        annual: 21,
        maternity: 180,
        paternity: 15
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.leave_type || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await api.post('/leaves', {
        leave_type: formData.leave_type,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        remarks: formData.remarks
      });

      if (response.data.success) {
        toast.success('Leave request submitted successfully');
        setIsDialogOpen(false);
        setFormData({
          leave_type: '',
          start_date: null,
          end_date: null,
          remarks: ''
        });
        fetchLeaves();
        // Refresh sick leave usage if it was a sick leave request
        if (formData.leave_type === 'sick') {
          fetchSickLeaveUsage();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
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

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setIsDetailsDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const calculatePotentialDeduction = () => {
    if (formData.leave_type !== 'sick' || !formData.start_date || !formData.end_date) {
      return null;
    }

    const requestedDays = calculateDays(formData.start_date, formData.end_date);
    const { remaining } = sickLeaveUsage;
    
    if (requestedDays <= remaining) {
      return {
        deduction: 0,
        unpaidDays: 0,
        message: `No deduction - within allowance (${remaining} days remaining)`
      };
    }

    const unpaidDays = requestedDays - remaining;
    // Assuming basic salary of ₹250,000/month for calculation (this would come from profile in real implementation)
    const dailySalary = 250000 / 30; // ₹8,333 per day
    const deduction = dailySalary * unpaidDays;

    return {
      deduction,
      unpaidDays,
      message: `${unpaidDays} unpaid days (exceeds remaining ${remaining} days)`
    };
  };

  const leaveStats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
  };

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
      <div className="space-y-6" data-testid="leave-page">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Leave Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="leave_type">Leave Type *</Label>
                  <Select value={formData.leave_type} onValueChange={(value) => setFormData({...formData, leave_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="paternity">Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => setFormData({...formData, start_date: date})}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => setFormData({...formData, end_date: date})}
                          disabled={(date) => date < (formData.start_date || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {formData.start_date && formData.end_date && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Total days: {calculateDays(formData.start_date, formData.end_date)} day(s)
                    </p>
                    {formData.leave_type === 'sick' && (
                      (() => {
                        const calculation = calculatePotentialDeduction();
                        return calculation ? (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            {calculation.deduction > 0 ? (
                              <div className="text-red-700">
                                <div className="flex items-center">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  <span className="font-semibold">Salary Impact: {formatCurrency(calculation.deduction)}</span>
                                </div>
                                <p className="text-xs mt-1">{calculation.message}</p>
                              </div>
                            ) : (
                              <div className="text-green-700">
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  <span className="font-semibold">No salary deduction</span>
                                </div>
                                <p className="text-xs mt-1">{calculation.message}</p>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Reason for leave (optional)"
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Request</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Leave Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{leaveStats.total}</p>
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
                  <p className="text-2xl font-bold">{leaveStats.pending}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{leaveStats.approved}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{leaveStats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sick Leave Balance Section */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-red-600" />
              Sick Leave Balance & Salary Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Balance */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Current Year Balance</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Total Allowance:</span>
                    <span className="font-bold">{sickLeaveUsage.allowance} days</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Used:</span>
                    <span className="font-bold text-red-600">{sickLeaveUsage.taken} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining:</span>
                    <span className="font-bold text-green-600">{sickLeaveUsage.remaining} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(sickLeaveUsage.taken / sickLeaveUsage.allowance) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Salary Deduction Examples */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Deduction Examples</h4>
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div className="text-xs font-medium text-green-800 mb-1">
                      Scenario 1: Within Allowance
                    </div>
                    <div className="text-xs text-green-700">
                      Taken: {sickLeaveUsage.taken} days, Request: 1 day
                      <br />
                      <span className="font-semibold">Result: No deduction</span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="text-xs font-medium text-red-800 mb-1">
                      Scenario 2: Exceeds Allowance
                    </div>
                    <div className="text-xs text-red-700">
                      Taken: {sickLeaveUsage.allowance} days, Request: 3 days
                      <br />
                      <span className="font-semibold">Result: 3 days deduction (~₹25,000)</span>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                    <div className="text-xs font-medium text-orange-800 mb-1">
                      Scenario 3: Partial Deduction
                    </div>
                    <div className="text-xs text-orange-700">
                      Taken: 8 days, Request: 6 days
                      <br />
                      <span className="font-semibold">Result: 2 days deduction (~₹16,667)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Calculation */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Current Request Impact</h4>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  {formData.leave_type === 'sick' && formData.start_date && formData.end_date ? (
                    (() => {
                      const calculation = calculatePotentialDeduction();
                      return calculation ? (
                        <div>
                          <div className="text-sm font-medium text-blue-800 mb-2">
                            Requesting: {calculateDays(formData.start_date, formData.end_date)} day(s)
                          </div>
                          {calculation.deduction > 0 ? (
                            <div className="text-red-700">
                              <div className="font-bold text-lg">{formatCurrency(calculation.deduction)}</div>
                              <div className="text-xs">{calculation.message}</div>
                            </div>
                          ) : (
                            <div className="text-green-700">
                              <div className="font-bold">No Deduction</div>
                              <div className="text-xs">{calculation.message}</div>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <div className="text-sm text-blue-600">
                      {formData.leave_type === 'sick' 
                        ? 'Select dates to see salary impact'
                        : 'Select sick leave to see salary impact'
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                {leaves.map((leave) => (
                  <TableRow key={leave.leave_id}>
                    <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                    <TableCell>{formatDate(leave.start_date)}</TableCell>
                    <TableCell>{formatDate(leave.end_date)}</TableCell>
                    <TableCell>
                      {calculateDays(leave.start_date, leave.end_date)} day(s)
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>{formatDate(leave.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(leave)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {leaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No leave requests found. Click "Apply for Leave" to submit your first request.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Leave Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Request Details</DialogTitle>
            </DialogHeader>
            {selectedLeave && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employee</Label>
                    <p className="text-sm font-semibold">{selectedLeave.employee_name || selectedLeave.employee_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Leave Type</Label>
                    <div className="mt-1">
                      {getLeaveTypeBadge(selectedLeave.leave_type)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                    <p className="text-sm font-semibold">{formatDate(selectedLeave.start_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                    <p className="text-sm font-semibold">{formatDate(selectedLeave.end_date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                    <p className="text-sm font-semibold">
                      {calculateDays(selectedLeave.start_date, selectedLeave.end_date)} day(s)
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedLeave.status)}
                    </div>
                  </div>
                </div>

                {selectedLeave.remarks && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employee Remarks</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selectedLeave.remarks}</p>
                  </div>
                )}

                {selectedLeave.admin_remarks && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Admin Remarks</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selectedLeave.admin_remarks}</p>
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

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-muted-foreground">Applied On</Label>
                  <p className="text-sm font-semibold">{formatDate(selectedLeave.created_at)}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Leave;
