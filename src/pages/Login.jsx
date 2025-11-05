import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { loginSchema } from '../utils/validators';
import { createSession } from '../services/authService';
import { getUser } from '../services/userService';
import { useAuthStore } from '../stores';
import { useUIStore } from '../stores';
import { ROUTES } from '../utils/constants';

function Login() {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, userProfile, isLoading: authLoading } = useAuthStore();
  const login = useAuthStore((state) => state.login);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && userProfile) {
      // Redirect to appropriate dashboard based on role
      if (userProfile.role === 'admin') {
        navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
      } else if (userProfile.role === 'student') {
        navigate(ROUTES.STUDENT.DASHBOARD, { replace: true });
      }
    }
  }, [isAuthenticated, userProfile, authLoading, navigate]);

  // Check if redirected due to inactive account
  useEffect(() => {
    if (locationState?.inactive) {
      showError(
        'Your account has been deactivated. Please contact admin at +91-7540892472 for assistance.',
        { duration: 15000 }
      );
    }
  }, [locationState, showError]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated && userProfile) {
    return null;
  }

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Create session
      await createSession(data.email, data.password);
      
      // Initialize auth and get user profile
      const authResult = await initializeAuth();
      
      // Check if user is inactive
      if (authResult && authResult.error === 'INACTIVE_USER') {
        showError(
          authResult.message || 'Your account has been deactivated. Please contact admin at +91-7540892472 for assistance.',
          { duration: 15000 } // Show for 15 seconds
        );
        return; // Don't proceed with login, stay on login page
      }
      
      if (!authResult) {
        // Other error - show generic message but don't navigate
        showError('Failed to load user profile. Please try again.');
        return; // Don't navigate, stay on login page
      }
      
      if (authResult && authResult.user && authResult.userProfile) {
        // Check if user is inactive (double check)
        const isActive = authResult.userProfile.is_active !== false; // Default to true if not set
        
        if (!isActive) {
          // User is inactive - delete session and show message
          try {
            const { deleteSession } = await import('../services/authService');
            await deleteSession();
          } catch (logoutError) {
            console.error('Error logging out inactive user:', logoutError);
          }
          
          showError(
            `Your account has been deactivated. Please contact admin at +91-7540892472 for assistance.`,
            { duration: 15000 } // Show for 15 seconds
          );
          return; // Don't proceed with login
        }
        
        // Update store with login action
        login(authResult.user, authResult.userProfile);
        
        const role = authResult.userProfile.role;
        showSuccess('Login successful! Welcome back.');
        
        // Redirect based on role - use replace to prevent back navigation to login
        if (role === 'admin') {
          navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
        } else if (role === 'student') {
          navigate(ROUTES.STUDENT.DASHBOARD, { replace: true });
        } else {
          // Fallback if role is not recognized
          navigate(ROUTES.HOME, { replace: true });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle permissions error specifically
      if (error.code === 'PERMISSIONS_ERROR' || error.message?.includes('PERMISSIONS_ERROR')) {
        const errorMessage = error.message.replace('PERMISSIONS_ERROR: ', '');
        showError(errorMessage, { duration: 10000 }); // Show for 10 seconds
      } else {
        showError(error.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-xl text-white/90 max-w-md">
              Continue your learning journey with our interactive quiz platform
            </p>
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Access thousands of quizzes</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Track your progress</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Learn at your own pace</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz App</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email?.message}
                {...register('email')}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default Login;

