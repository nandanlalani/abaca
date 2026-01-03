import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Edit, 
  Save,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setProfile(response.data.profile);
        setEditData(response.data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put('/profiles/me', editData);
      if (response.data.success) {
        setProfile(response.data.profile);
        setEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully');
        setIsPasswordDialogOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Profile not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
          <div className="flex space-x-2">
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleChangePassword}>
                      Change Password
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {editing ? (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => {
                  setEditing(false);
                  setEditData(profile);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="job">Job Details</TabsTrigger>
            <TabsTrigger value="salary">Salary Structure</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input
                      id="employee_id"
                      value={profile.employee_id || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <div className="mt-2">
                      <Badge variant="secondary" className="capitalize">
                        {user?.role || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={editing ? (editData.first_name || '') : (profile.first_name || '')}
                      onChange={(e) => editing && setEditData({...editData, first_name: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={editing ? (editData.last_name || '') : (profile.last_name || '')}
                      onChange={(e) => editing && setEditData({...editData, last_name: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <Input
                        id="email"
                        value={profile.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <Input
                        id="phone"
                        value={editing ? (editData.phone || '') : (profile.phone || '')}
                        onChange={(e) => editing && setEditData({...editData, phone: e.target.value})}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-3" />
                    <Textarea
                      id="address"
                      value={editing ? (editData.address || '') : (profile.address || '')}
                      onChange={(e) => editing && setEditData({...editData, address: e.target.value})}
                      disabled={!editing}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={editing 
                        ? (editData.job_details?.title || '') 
                        : (profile.job_details?.title || '')
                      }
                      onChange={(e) => editing && setEditData({
                        ...editData, 
                        job_details: {...(editData.job_details || {}), title: e.target.value}
                      })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={editing 
                        ? (editData.job_details?.department || '') 
                        : (profile.job_details?.department || '')
                      }
                      onChange={(e) => editing && setEditData({
                        ...editData, 
                        job_details: {...(editData.job_details || {}), department: e.target.value}
                      })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="joining_date">Joining Date</Label>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <Input
                        id="joining_date"
                        type="date"
                        value={editing 
                          ? (editData.job_details?.joining_date ? new Date(editData.job_details.joining_date).toISOString().split('T')[0] : '') 
                          : (profile.job_details?.joining_date ? new Date(profile.job_details.joining_date).toISOString().split('T')[0] : '')
                        }
                        onChange={(e) => editing && setEditData({
                          ...editData, 
                          job_details: {...(editData.job_details || {}), joining_date: e.target.value}
                        })}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="employment_type">Employment Type</Label>
                    <Input
                      id="employment_type"
                      value={editing 
                        ? (editData.job_details?.employment_type || '') 
                        : (profile.job_details?.employment_type || '')
                      }
                      onChange={(e) => editing && setEditData({
                        ...editData, 
                        job_details: {...(editData.job_details || {}), employment_type: e.target.value}
                      })}
                      disabled={!editing}
                      className="capitalize"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Salary Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="basic_salary">Basic Salary</Label>
                    <Input
                      id="basic_salary"
                      value={formatCurrency(profile.salary_structure?.basic || 0)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hra">HRA</Label>
                    <Input
                      id="hra"
                      value={formatCurrency(profile.salary_structure?.hra || 0)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="allowances">Allowances</Label>
                    <Input
                      id="allowances"
                      value={formatCurrency(profile.salary_structure?.allowances || 0)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deductions">Deductions</Label>
                    <Input
                      id="deductions"
                      value={formatCurrency(profile.salary_structure?.deductions || 0)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-green-700">Gross Salary</span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatCurrency(
                        (profile.salary_structure?.basic || 0) + 
                        (profile.salary_structure?.hra || 0) + 
                        (profile.salary_structure?.allowances || 0)
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="emergency_name">Contact Name</Label>
                    <Input
                      id="emergency_name"
                      value={editing 
                        ? (editData.emergency_contact?.name || '') 
                        : (profile.emergency_contact?.name || '')
                      }
                      onChange={(e) => editing && setEditData({
                        ...editData, 
                        emergency_contact: {...(editData.emergency_contact || {}), name: e.target.value}
                      })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_relationship">Relationship</Label>
                    <Input
                      id="emergency_relationship"
                      value={editing 
                        ? (editData.emergency_contact?.relationship || '') 
                        : (profile.emergency_contact?.relationship || '')
                      }
                      onChange={(e) => editing && setEditData({
                        ...editData, 
                        emergency_contact: {...(editData.emergency_contact || {}), relationship: e.target.value}
                      })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_phone">Phone Number</Label>
                    <Input
                      id="emergency_phone"
                      value={editing 
                        ? (editData.emergency_contact?.phone || '') 
                        : (profile.emergency_contact?.phone || '')
                      }
                      onChange={(e) => editing && setEditData({
                        ...editData, 
                        emergency_contact: {...(editData.emergency_contact || {}), phone: e.target.value}
                      })}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
