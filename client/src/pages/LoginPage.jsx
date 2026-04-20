import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAImx-F3zteMsQs0jlegeAPE7lFP8gGSSWfgUk86yJabHa-ejqbr4_G6mXzwS2ViNiI3doxB6k9RbmWSJuepv01uqII8tAl2g9FBiefO-akHJ2A22cYpz7Guv8lSY1aF2HwNcjul1AnOaToZ1KkLCDcV6Cxw0VR09JPAcFJHnX08tu2VW1nXfbEpj5O0RODkJ9OOgqiUtke_DQ6KT1qq7Je_LZR_8cxgL3y78yw8z2asg2KEsVMTg3m-Qb33vS9KilP9YfTsSmgkK0';

export default function LoginPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const { login } = useAuth();
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

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      window.alert(submitError.message || 'Login failed');
    }
  };

  return (
    <>
      {/* TopNavBar Suppression Check: This is a Focused Journey (Login), but we include a minimalist brand anchor per design system */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-6 py-4 z-50 glass-header">
        <div className="text-xl font-extrabold text-primary tracking-tighter font-headline">
          CampusStash
        </div>
        <div className="flex items-center gap-4">
          <a className="text-sm font-semibold text-primary/60 hover:text-primary transition-colors" href="#">
            Help
          </a>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center px-4 pt-20 pb-12">
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
                  <p className="text-white/80 text-xs">Trusted by 50,000+ students across the country</p>
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
                    <a className="text-xs font-semibold text-secondary hover:underline" href="#">
                      Forgot Password?
                    </a>
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
                  className="w-full academic-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-container/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  type="submit"
                >
                  Log In
                  <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">
                    arrow_forward
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.2em] font-bold">
                  <span className="bg-surface-container-lowest px-4 text-outline">or continue with</span>
                </div>
              </div>

              {/* SSO Option */}
              <button className="w-full flex items-center justify-center gap-3 py-4 border-2 border-surface-container-high rounded-xl hover:bg-surface-container-low transition-colors active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  ></path>
                </svg>
                <span className="font-semibold text-sm text-on-surface-variant">University SSO</span>
              </button>

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

      {/* Footer Information (Non-Nav) */}
      <footer className="py-8 text-center text-[10px] uppercase tracking-widest text-outline font-bold">
        © 2024 CampusStash — Intellectual Property of Academic Curators
      </footer>
      {/* Mobile Bottom Navigation Suppression: Login is a focused task, but per instructions we omit Top/Side nav for focused journeys. BottomNavBar is only for top-level destinations. */}
    </>
  );
}