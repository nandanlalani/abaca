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
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center space-x-2 transition-transform hover:scale-105">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-white font-black text-xl">D</span>
                </div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Dayflow</span>
              </Link>

              <div className="hidden md:flex space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 ${
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100" data-testid="notifications-button">
                    <Bell size={20} className="text-slate-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 rounded-2xl p-0 overflow-hidden shadow-2xl border-slate-200">
                  <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg">
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[400px]">
                    {notifications.length > 0 ? (
                      <div className="p-3">
                        {notifications.map((notification) => (
                          <div
                            key={notification.notification_id}
                            className={`p-4 rounded-xl mb-2 border transition-all cursor-pointer hover:scale-[0.99] active:scale-[0.98] ${
                              notification.is_read 
                                ? 'bg-white border-slate-100' 
                                : 'bg-primary/5 border-primary/10 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                                  notification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-primary text-white shadow-md shadow-primary/20'
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${
                                    notification.is_read ? 'text-slate-600' : 'text-slate-900'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className={`text-xs mt-1 leading-relaxed ${
                                    notification.is_read ? 'text-slate-400' : 'text-slate-600'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center mt-3 space-x-2 text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                      {formatTimeAgo(notification.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-3">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.notification_id); }}
                                    className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 text-primary"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.notification_id); }}
                                  className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">All caught up!</p>
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 p-1.5 h-auto rounded-xl hover:bg-slate-100 transition-all" data-testid="user-menu">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/20">
                      <User size={18} className="text-white" />
                    </div>
                    <div className="hidden md:block text-left mr-2">
                      <p className="text-sm font-bold text-slate-900 leading-none">{user?.email?.split('@')[0]}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{user?.role}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl border-slate-200">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl p-3 cursor-pointer" data-testid="profile-menu-item">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="font-bold text-slate-700">My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-3 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50" data-testid="logout-menu-item">
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center mr-3">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-bold">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 rounded-xl"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-6 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">{children}</main>
    </div>
  );
};

export default Layout;
