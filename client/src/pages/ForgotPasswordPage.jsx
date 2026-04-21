import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthFooter from '../components/auth/AuthFooter';
import AuthNavbar from '../components/auth/AuthNavbar';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { forgotPassword, authLoading } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [error, setError] = useState('');

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen flex flex-col';

    return () => {
      document.body.className = previousBodyClass;
    };
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }

    try {
      await forgotPassword(normalizedEmail);
      navigate('/reset-password', {
        replace: true,
        state: { email: normalizedEmail },
      });
    } catch (submitError) {
      setError(submitError.message || 'Could not send reset code.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      <AuthNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(27,27,33,0.06)] border border-outline-variant/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-container-low rounded-full mb-4">
              <span className="material-symbols-outlined text-3xl text-primary">lock_reset</span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-primary mb-2">Forgot Password</h1>
            <p className="text-sm text-on-surface-variant">
              Enter your account email and we will send a 6-digit reset code.
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1" htmlFor="email">
                University Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-lg">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="student@g.bracu.ac.bd"
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface placeholder:text-outline/50"
                />
              </div>
            </div>

            {error ? (
              <p className="text-sm font-semibold text-error bg-error-container/10 rounded px-3 py-2">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full academic-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-container/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
            >
              {authLoading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Remembered your password?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
