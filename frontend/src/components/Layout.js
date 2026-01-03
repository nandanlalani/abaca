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
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_update':
      case 'leave_request': return <FileText className="w-4 h-4" />;
      case 'payroll': return <DollarSign className="w-4 h-4" />;
      case 'attendance': return <Calendar className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
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
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-12">
              <Link to="/dashboard" className="flex items-center space-x-2.5 group">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 group-hover:scale-110 transition-transform">
                  <span className="text-white font-black text-xl">D</span>
                </div>
                <span className="font-black text-2xl tracking-tighter bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Dayflow</span>
              </Link>

              <div className="hidden lg:flex space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${
                        isActive
                          ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl hover:bg-slate-100 transition-colors">
                    <Bell size={20} className="text-slate-500" />
                    {unreadCount > 0 && (
                      <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[400px] rounded-[2rem] p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-slate-200">
                  <div className="flex items-center justify-between p-6 bg-slate-50/50 border-b border-slate-100">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-[10px] font-black uppercase tracking-wider text-violet-600 hover:bg-violet-50 rounded-xl">
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[450px]">
                    {notifications.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {notifications.map((n) => (
                          <div
                            key={n.notification_id}
                            className={`p-4 rounded-[1.5rem] border transition-all ${
                              n.is_read ? 'bg-white border-slate-100' : 'bg-violet-50/50 border-violet-100 shadow-sm shadow-violet-500/5'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${
                                n.is_read ? 'bg-slate-100 text-slate-400' : 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                              }`}>
                                {getNotificationIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold leading-tight ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</p>
                                <p className={`text-xs mt-1 leading-relaxed ${n.is_read ? 'text-slate-400' : 'text-slate-600'}`}>{n.message}</p>
                                <div className="flex items-center mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <Clock className="w-3 h-3 mr-1.5" />
                                  {formatTimeAgo(n.created_at)}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                {!n.is_read && (
                                  <button onClick={() => markAsRead(n.notification_id)} className="p-2 hover:bg-violet-100 rounded-xl text-violet-600 transition-colors">
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={() => deleteNotification(n.notification_id)} className="p-2 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-20 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <Bell className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm tracking-tight">No notifications yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 p-1.5 h-auto rounded-2xl hover:bg-slate-100 transition-all">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="hidden sm:block text-left mr-2">
                      <p className="text-sm font-black text-slate-900 leading-none">{user?.email?.split('@')[0]}</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-600 mt-1.5">{user?.role}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-[1.5rem] p-2 shadow-2xl border-slate-200">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl p-3 cursor-pointer">
                    <User className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-700">Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 bg-slate-100" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-3 cursor-pointer text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-bold uppercase tracking-widest text-[11px]">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 rounded-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-6 border-t border-slate-100 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      isActive ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20' : 'text-slate-500 hover:bg-slate-100'
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">{children}</main>
    </div>
  );
};

export default Layout;
