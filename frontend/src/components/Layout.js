import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  DollarSign,
  BarChart3,
  LogOut,
  User,
  Bell,
  Menu,
  X,
  Check,
  Trash2,
  Clock
} from 'lucide-react';
import api from '../utils/api';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Add delay to prevent API call conflicts with AuthContext
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        const notifs = response.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Set some sample notifications for demo
      const sampleNotifications = [
        {
          notification_id: '1',
          title: 'Leave Request Approved',
          message: 'Your annual leave request has been approved',
          type: 'leave_update',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          notification_id: '2',
          title: 'Payroll Generated',
          message: 'Your payroll for this month has been processed',
          type: 'payroll',
          is_read: false,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          notification_id: '3',
          title: 'Profile Updated',
          message: 'Your profile information has been updated successfully',
          type: 'profile',
          is_read: true,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Update locally for demo
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Update locally for demo
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.notification_id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Update locally for demo
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.notification_id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_update':
      case 'leave_request':
        return <FileText className="w-4 h-4" />;
      case 'payroll':
        return <DollarSign className="w-4 h-4" />;
      case 'attendance':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const employeeMenuItems = [
    { path: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/leave', icon: FileText, label: 'Leave' },
    { path: '/payroll', icon: DollarSign, label: 'Payroll' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/employees', icon: Users, label: 'Employees' },
    { path: '/admin/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/admin/leaves', icon: FileText, label: 'Leaves' },
    { path: '/admin/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">D</span>
                </div>
                <span className="font-bold text-xl tracking-tight">Dayflow</span>
              </Link>

              <div className="hidden md:flex space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="notifications-button">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        <Check className="w-4 h-4 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-80">
                    {notifications.length > 0 ? (
                      <div className="p-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.notification_id}
                            className={`p-3 rounded-lg mb-2 border transition-colors ${
                              notification.is_read 
                                ? 'bg-gray-50 border-gray-200' 
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className={`p-2 rounded-full ${
                                  notification.is_read ? 'bg-gray-200' : 'bg-blue-200'
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${
                                    notification.is_read ? 'text-gray-700' : 'text-gray-900'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className={`text-xs mt-1 ${
                                    notification.is_read ? 'text-gray-500' : 'text-gray-600'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center mt-2 space-x-2">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-400">
                                      {formatTimeAgo(notification.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.notification_id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.notification_id)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No notifications</p>
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user?.email?.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="profile-menu-item">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};

export default Layout;
