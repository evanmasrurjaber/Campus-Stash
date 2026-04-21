import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthFooter from '../components/auth/AuthFooter';
import AuthNavbar from '../components/auth/AuthNavbar';
import { useAuth } from '../hooks/useAuth';

const HERO_IMAGE = 'bracu_open_space.jpg';

export default function LoginPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const { login, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen flex flex-col';

    return () => {
      document.body.className = previousBodyClass;
    };
  }, []);

  const onChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const onSignupClick = (event) => {
    event.preventDefault();
    navigate('/signup');
  };

  const onForgotPasswordClick = (event) => {
    event.preventDefault();
    navigate('/forgot-password', {
      state: { email: form.email.trim().toLowerCase() },
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (authLoading) return;

    try {
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      if (submitError.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { 
          state: { email: submitError.email } 
        });
      } else {
        window.alert(submitError.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      <AuthNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Side: Editorial Content */}
          <div className="hidden md:flex flex-col justify-center space-y-8 pr-12">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-widest rounded-full">
                Curated Marketplace
              </span>
              <h1 className="text-5xl lg:text-6xl font-headline font-extrabold tracking-tight text-primary leading-tight">
                Your campus, <br />
                <span className="text-secondary-container">perfectly curated.</span>
              </h1>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                Join the premier academic community for buying, selling, and recovering items. Secure, verified,
                and exclusive to your university.
              </p>
            </div>

            {/* Intentional Asymmetry: Featured Image Card */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary-container/5 rounded-[2rem] -rotate-2"></div>
              <div className="relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm aspect-[4/3]">
                <img
                  className="w-full h-full object-cover"
                  data-alt="Modern university library interior with large windows, students studying at wooden tables, soft natural afternoon light, high-end academic atmosphere"
                  src={HERO_IMAGE}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-headline font-bold">University Verified Community</p>
                  <p className="text-white/80 text-xs">For the students, by the students</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full max-w-md mx-auto md:ml-auto">
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-xl shadow-none border-none relative overflow-hidden">
              {/* Form Header */}
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-headline font-bold text-primary mb-2">Welcome Back</h2>
                <p className="text-on-surface-variant text-sm">
                  Please enter your credentials to access your stash.
                </p>
              </div>

              {/* Login Form */}
              <form action="#" className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1" htmlFor="email">
                    University Email
                  </label>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-lg"
                      data-icon="mail"
                    >
                      mail
                    </span>
                    <input
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface placeholder:text-outline/50"
                      id="email"
                      placeholder="student@university.edu"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-xs font-bold uppercase tracking-widest text-primary/70" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={onForgotPasswordClick}
                      className="text-xs font-semibold text-secondary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-lg"
                      data-icon="lock"
                    >
                      lock
                    </span>
                    <input
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface placeholder:text-outline/50"
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      value={form.password}
                      onChange={onChange}
                    />
                  </div>
                </div>

                <button
                  className="w-full academic-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-container/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                  type="submit"
                  disabled={authLoading}
                >
                  {authLoading ? 'Logging In...' : 'Log In'}
                  <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">
                    arrow_forward
                  </span>
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-on-surface-variant">
                  New to the community?
                  <a className="text-primary font-bold hover:underline ml-1" href="#" onClick={onSignupClick}>
                    Sign Up
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}