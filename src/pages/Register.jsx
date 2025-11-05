import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, Shield, Sparkles } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { registerSchema } from '../utils/validators';
import { createAccount } from '../services/authService';
import { useAuthStore } from '../stores';
import { useUIStore } from '../stores';
import { ROUTES } from '../utils/constants';

const ADMIN_SECRET_KEY = 'Rasmi@2025';

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, userProfile, isLoading: authLoading } = useAuthStore();
  const login = useAuthStore((state) => state.login);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    setValue,
    trigger,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange', // Re-validate on change
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const secretKey = watch('secretKey');

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

  // Real-time validation for confirm password when password or confirmPassword changes
  useEffect(() => {
    if (confirmPassword && confirmPassword.length > 0) {
      trigger('confirmPassword');
    }
  }, [password, confirmPassword, trigger]);

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

  // Don't render register form if already authenticated (will redirect)
  if (isAuthenticated && userProfile) {
    return null;
  }

  const onSubmit = async (data) => {
    // Validate admin secret key if admin is selected
    if (selectedRole === 'admin') {
      if (!secretKey || secretKey !== ADMIN_SECRET_KEY) {
        setError('secretKey', {
          type: 'manual',
          message: 'Invalid admin secret key',
        });
        showError('Invalid admin secret key. Please enter the correct key to register as admin.');
        return;
      }
    }

    setIsLoading(true);
    try {
      // Create account with role
      const result = await createAccount(data.email, data.password, data.name, selectedRole);
      
      // Verify that profile was created
      if (!result.profile) {
        showError('Account created but user profile could not be saved. Please contact support.');
        console.error('Registration completed but profile is missing:', result);
        return;
      }
      
      // Verify profile has role
      if (!result.profile.role) {
        showError('Account created but role was not saved. Please contact support.');
        console.error('Registration completed but role is missing:', result.profile);
        return;
      }
      
      // Auto-login after registration
      await login(result, result.profile);
      showSuccess('Account created successfully! Welcome to Quiz App.');
      
      // Redirect based on role from profile (not from selectedRole to ensure consistency)
      setTimeout(() => {
        if (result.profile.role === 'admin') {
          navigate(ROUTES.ADMIN.DASHBOARD);
        } else {
          navigate(ROUTES.STUDENT.DASHBOARD);
        }
      }, 500);
    } catch (error) {
      console.error('Registration error:', error);
      showError(error.message || 'Failed to create account. Please try again.');
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
              Join Quiz App
            </h1>
            <p className="text-xl text-white/90 max-w-md">
              Start your learning journey with interactive quizzes and track your progress
            </p>
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Create and manage quizzes</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Real-time performance tracking</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Personalized learning experience</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz App</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Sign up to get started</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedRole === 'student'
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <GraduationCap className={`w-6 h-6 mx-auto mb-2 ${
                      selectedRole === 'student' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <div className={`font-semibold ${
                      selectedRole === 'student' ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      Student
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedRole === 'student' ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      Take quizzes
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedRole === 'admin'
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Shield className={`w-6 h-6 mx-auto mb-2 ${
                      selectedRole === 'admin' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <div className={`font-semibold ${
                      selectedRole === 'admin' ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      Admin
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedRole === 'admin' ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      Create quizzes
                    </div>
                  </button>
                </div>
                <input type="hidden" {...register('role')} value={selectedRole} />
              </div>

              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                leftIcon={<User className="w-5 h-5" />}
                error={errors.name?.message}
                {...register('name')}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email?.message}
                {...register('email')}
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
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
                helperText="Must be at least 6 characters"
                {...register('password', {
                  onChange: () => {
                    // When password changes, re-validate confirm password
                    if (confirmPassword) {
                      trigger('confirmPassword');
                    }
                  }
                })}
                required
              />

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                required
              />

              {/* Admin Secret Key - Only show when admin is selected */}
              {selectedRole === 'admin' && (
                <div className="relative">
                  <Input
                    label="Admin Secret Key"
                    type={showSecretKey ? 'text' : 'password'}
                    placeholder="Enter admin secret key"
                    leftIcon={<Shield className="w-5 h-5" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showSecretKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                    error={errors.secretKey?.message}
                    helperText="Required to register as admin"
                    {...register('secretKey', {
                      required: selectedRole === 'admin' ? 'Admin secret key is required' : false,
                    })}
                    required
                  />
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Admin access requires a valid secret key. Only authorized personnel can register as administrators.</span>
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Sign in
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

export default Register;

