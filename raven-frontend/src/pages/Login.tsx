import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  User as UserIcon, Mail, Lock, Phone,
  ChevronRight, ChevronLeft, School, 
  ArrowRight, Eye, EyeOff, Info
} from 'lucide-react';


export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAppContext();

  const [isLogin, setIsLogin] = useState(true);
  
  // Shared & Step 1 state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: '#ef4444' });

  // Step 2 state: Persona & Preferences
  const [role, setRole] = useState<'student' | 'guest'>('student');
  const [campusId, setCampusId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredRoute, setPreferredRoute] = useState('Giri ⇄ Main Campus');

  // Multi-step signup control
  const [signupStep, setSignupStep] = useState(1); // 1 = Credentials, 2 = Profile & Finish

  // General loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: 'Weak', color: '#ef4444' });
      return;
    }
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = 'Weak';
    let color = '#ef4444'; // Red
    if (score >= 4) {
      label = 'Strong';
      color = '#10b981'; // Green
    } else if (score >= 2) {
      label = 'Medium';
      color = '#f59e0b'; // Amber
    }

    setPasswordStrength({ score, label, color });
  }, [password]);
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupStep === 1) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      setSignupStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate Profile/Step 2 Inputs
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number.');
      setLoading(false);
      return;
    }
    if (role !== 'guest' && !campusId.trim()) {
      setError(role === 'student' ? 'Please enter your Matric Number.' : 'Please enter your Campus ID.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        // Complete Signup Process
        await register(
          name, 
          email, 
          password, 
          'avatar_blue', 
          phoneNumber, 
          role, 
          campusId, 
          preferredRoute
        );
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 select-none"
      style={{
        background: '#0a0c10',
        fontFamily: "'DM Sans', 'Inter', system-ui, -apple-system, sans-serif",
      }}
    >


      <div className="w-full max-w-[460px] z-10 relative">
        {/* Brand logo container */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: '#2563eb',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="5" fill="white"/>
              <circle cx="16" cy="16" r="2" fill="#2563eb"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-0.5 text-white">
            Raven
          </h1>
          <p className="text-xs text-gray-500">
            Smart Campus Transit
          </p>
        </div>

        {/* Auth Glass Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 relative"
          style={{
            background: '#111318',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Top Switch tabs */}
          <div 
            className="flex p-1 rounded-xl mb-6 relative z-10"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer z-10"
              style={{
                background: isLogin ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                color: isLogin ? '#ffffff' : '#9ca3af',
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setSignupStep(1); }}
              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer z-10"
              style={{
                background: !isLogin ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                color: !isLogin ? '#ffffff' : '#9ca3af',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Signup Steps Progress Indicator */}
          {!isLogin && (
            <div className="mb-6 flex flex-col space-y-2 relative z-10">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Step {signupStep} of 2
                </span>
                <span className="text-[10px] font-semibold text-gray-400">
                  {signupStep === 1 && 'Basic Account'}
                  {signupStep === 2 && 'Campus Identity'}
                </span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                <div 
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(signupStep / 2) * 100}%`,
                    background: '#2563eb',
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div 
              className="p-4 rounded-xl mb-4 text-xs font-semibold border flex items-start space-x-2 relative z-10"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.15)',
              }}
            >
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Area */}
          {isLogin ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@student.unibuja.edu.ng"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Password
                  </label>
                  <a href="#forgot" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= SIGN UP FLOW ================= */
            <div className="relative z-10">
              
              {/* STEP 1: Basic Credentials */}
              {signupStep === 1 && (
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <UserIcon size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="e.g. name@student.unibuja.edu.ng"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Create Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                          <span className="text-gray-500">Password Strength</span>
                          <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden flex space-x-0.5">
                          {[1, 2, 3, 4, 5].map(tick => (
                            <div 
                              key={tick}
                              className="h-full flex-1 transition-all duration-300"
                              style={{
                                background: tick <= passwordStrength.score ? passwordStrength.color : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer"
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                    }}
                  >
                    <span>Proceed to Campus Identity</span>
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </form>
              )}

              {/* STEP 2: Campus Identity & Preferences */}
              {signupStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Role Selection Tabs */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Campus Persona / Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['student', 'guest'] as const).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setRole(r); setCampusId(''); }}
                          className="py-3 px-1 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all capitalize"
                          style={{
                            background: role === r ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.3)',
                            borderColor: role === r ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            color: role === r ? '#ffffff' : '#9ca3af',
                          }}
                        >
                          <School size={16} className={role === r ? "text-white" : "text-gray-500"} />
                          <span className="text-[10px] font-bold">{r}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ID Input depending on Role */}
                  {role !== 'guest' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {role === 'student' ? 'Matric / Registration Number' : 'Employee ID Number'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={role === 'student' ? 'e.g. 19/SCI/012' : 'e.g. FAC-204'}
                        value={campusId}
                        onChange={e => setCampusId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  )}

                  {/* Phone Number Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Mobile Number (For Safety Contacts)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <Phone size={14} />
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +234 812 345 6789"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  </div>

                  {/* Preferred route */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Primary Transit Route
                    </label>
                    <select
                      value={preferredRoute}
                      onChange={e => setPreferredRoute(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-gray-500 outline-none"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                      }}
                    >
                      <option value="Giri ⇄ Main Campus" style={{ background: '#0a0c10' }}>Giri ⇄ Main Campus</option>
                      <option value="Gwagwalada ⇄ Main Campus" style={{ background: '#0a0c10' }}>Gwagwalada ⇄ Main Campus</option>
                      <option value="Giri ⇄ Gwagwalada" style={{ background: '#0a0c10' }}>Giri ⇄ Gwagwalada</option>
                    </select>
                  </div>

                  <div className="flex w-full space-x-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="flex-1 py-3 rounded-xl text-xs font-bold transition-all border text-gray-400 hover:text-white flex items-center justify-center space-x-1 cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: 'rgba(255,255,255,0.06)'
                      }}
                    >
                      <ChevronLeft size={14} />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center space-x-1 cursor-pointer"
                      style={{
                        background: '#059669',
                      }}
                    >
                      {loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <span>Launch Account</span>
                          <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
