import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="w-full max-w-[1100px] grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-200">
        {/* Left Side: Branding/Marketing */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-12">
              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg shadow-black/10">
                <span className="text-white font-black text-2xl">D</span>
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">Dayflow</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6 tracking-tighter">
              Manage your <br />
              <span className="text-violet-200 underline decoration-indigo-400 decoration-4 underline-offset-8">workforce</span> with ease.
            </h1>
            <p className="text-lg text-indigo-100 max-w-sm mb-10 font-medium">
              The modern human resource management system designed for simplicity and growth.
            </p>
            
            <div className="space-y-6">
              {[
                'Automated Attendance Logs',
                'One-click Payroll Generation',
                'Intuitive Employee Lifecycle',
                'Data-driven HR Insights'
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-4 text-indigo-50/90 group">
                  <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <div className="h-2 w-2 rounded-full bg-indigo-300" />
                  </div>
                  <span className="text-sm font-bold tracking-wide">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 pt-12 border-t border-white/10">
            <p className="text-xs text-indigo-200/60 font-bold uppercase tracking-widest">© 2026 Dayflow HRMS • Built for excellence</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="signin-email-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="password" className="text-slate-700 font-semibold text-sm">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  data-testid="forgot-password-link"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="signin-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              disabled={loading}
              data-testid="signin-submit-button"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-primary hover:underline underline-offset-4"
                data-testid="signup-link"
              >
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-10 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Demo Access</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Admin:</span>
                <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">admin@dayflow.com / Admin123</code>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Employee:</span>
                <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">john.doe@dayflow.com / Employee123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
