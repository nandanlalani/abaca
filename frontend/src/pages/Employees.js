import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Search, Plus, Edit, Eye } from 'lucide-react';
import api from '../utils/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee',
    department: '',
    job_title: '',
    basic_salary: ''
  });
  const [editEmployee, setEditEmployee] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    job_title: '',
    department: '',
    basic_salary: ''
  });

  useEffect(() => {
    // Add delay to prevent API call conflicts
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 400);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/profiles/employees');
      if (response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditEmployee({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      phone: employee.phone || '',
      address: employee.address || '',
      job_title: employee.job_details?.title || '',
      department: employee.job_details?.department || '',
      basic_salary: employee.salary_structure?.basic || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/profiles/employees/${selectedEmployee.employee_id}`, editEmployee);
      if (response.data.success) {
        toast.success('Employee updated successfully');
        setIsEditDialogOpen(false);
        fetchEmployees();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/add-employee', newEmployee);
      if (response.data.success) {
        toast.success('Employee added successfully');
        setIsAddDialogOpen(false);
        setNewEmployee({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'employee',
          department: '',
          job_title: '',
          basic_salary: ''
        });
        fetchEmployees();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hr': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading employees...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="employees-page">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Employee Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={newEmployee.first_name}
                      onChange={(e) => setNewEmployee({...newEmployee, first_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={newEmployee.last_name}
                      onChange={(e) => setNewEmployee({...newEmployee, last_name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={newEmployee.role} onValueChange={(value) => setNewEmployee({...newEmployee, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_title">Job Title *</Label>
                    <Input
                      id="job_title"
                      value={newEmployee.job_title}
                      onChange={(e) => setNewEmployee({...newEmployee, job_title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="basic_salary">Basic Salary *</Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      value={newEmployee.basic_salary}
                      onChange={(e) => setNewEmployee({...newEmployee, basic_salary: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Employee</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Employees ({employees.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-medium">{employee.employee_id}</TableCell>
                    <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.job_details?.department || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {employee.role?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.is_verified ? 'default' : 'secondary'}>
                        {employee.is_verified ? 'Active' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEmployee(employee)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Employee Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Employee ID</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.employee_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.job_details?.department || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Job Title</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.job_details?.title || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Joining Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.job_details?.joining_date 
                      ? new Date(selectedEmployee.job_details.joining_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Basic Salary</Label>
                  <p className="text-sm text-muted-foreground">
                    ₹{selectedEmployee.salary_structure?.basic?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.address || 'N/A'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={editEmployee.first_name}
                    onChange={(e) => setEditEmployee({...editEmployee, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={editEmployee.last_name}
                    onChange={(e) => setEditEmployee({...editEmployee, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editEmployee.phone}
                  onChange={(e) => setEditEmployee({...editEmployee, phone: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={editEmployee.address}
                  onChange={(e) => setEditEmployee({...editEmployee, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_department">Department *</Label>
                  <Input
                    id="edit_department"
                    value={editEmployee.department}
                    onChange={(e) => setEditEmployee({...editEmployee, department: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_job_title">Job Title *</Label>
                  <Input
                    id="edit_job_title"
                    value={editEmployee.job_title}
                    onChange={(e) => setEditEmployee({...editEmployee, job_title: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_basic_salary">Basic Salary *</Label>
                <Input
                  id="edit_basic_salary"
                  type="number"
                  value={editEmployee.basic_salary}
                  onChange={(e) => setEditEmployee({...editEmployee, basic_salary: e.target.value})}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Employee</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Employees;
