import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthFooter from '../components/auth/AuthFooter';
import AuthNavbar from '../components/auth/AuthNavbar';
import { useAuth } from '../hooks/useAuth';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword, authLoading } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const email = location.state?.email || '';
  const inputRefs = useRef([]);

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen flex flex-col';

    return () => {
      document.body.className = previousBodyClass;
    };
  }, []);

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const nextCode = [...code];
    nextCode[index] = value.slice(-1);
    setCode(nextCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const token = code.join('');

    if (token.length !== 6) {
      setError('Please enter all 6 digits of the reset code.');
      return;
    }

    if (!newPassword) {
      setError('New password is required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    try {
      await resetPassword(token, newPassword);
      navigate('/login', {
        replace: true,
        state: {
          resetSuccess: true,
          email,
        },
      });
    } catch (submitError) {
      setError(submitError.message || 'Could not reset password.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      <AuthNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-8%] right-[-12%] w-[55%] h-[55%] bg-primary-fixed-dim/15 rounded-full blur-[110px]"></div>
          <div className="absolute bottom-[-12%] left-[-10%] w-[55%] h-[55%] bg-surface-container-high/40 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl p-8 relative z-10 shadow-[0_8px_24px_rgba(27,27,33,0.06)] border border-outline-variant/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-container-low rounded-full mb-4">
              <span className="material-symbols-outlined text-3xl text-primary">password</span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-primary mb-2">Reset Password</h1>
            <p className="text-sm text-on-surface-variant">
              Enter the 6-digit reset code and choose your new password.
            </p>
            {email ? (
              <p className="text-xs text-on-surface-variant mt-2">
                Code sent to <span className="font-semibold text-on-surface">{email}</span>
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant mt-2">
                Email not provided. Enter your reset code from your inbox.
              </p>
            )}
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="sr-only" htmlFor="code-1">
                Reset Code
              </label>
              <div className="flex justify-center gap-2" dir="ltr">
                {code.map((digit, index) => (
                  <div key={index} className="contents">
                    {index === 3 ? (
                      <div className="w-2 flex items-center justify-center text-outline-variant font-bold" aria-hidden="true">
                        -
                      </div>
                    ) : null}
                    <input
                      ref={(el) => (inputRefs.current[index] = el)}
                      id={`code-${index + 1}`}
                      aria-label={`Digit ${index + 1}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(event) => handleCodeChange(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      placeholder="•"
                      className="w-12 h-14 text-center font-headline text-2xl font-bold bg-surface-container-low border-none rounded focus:ring-2 focus:ring-surface-tint focus:outline-none text-on-surface transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 chars with uppercase, lowercase, number, symbol"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface placeholder:text-outline/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface placeholder:text-outline/50"
              />
            </div>

            {error ? (
              <p className="text-sm font-semibold text-error bg-error-container/10 rounded px-3 py-2">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full academic-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-container/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
            >
              {authLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-on-surface-variant">
            Need a new code?{' '}
            <Link to="/forgot-password" className="text-primary font-bold hover:underline">
              Request again
            </Link>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
