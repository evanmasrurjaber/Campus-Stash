import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthFooter from '../components/auth/AuthFooter';
import AuthNavbar from '../components/auth/AuthNavbar';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(120);
  const inputRefs = useRef([]);
  const { verifyEmail, resendCode, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const canResend = !authLoading && resendCooldown === 0;
  const cooldownLabel = `${String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:${String(
    resendCooldown % 60,
  ).padStart(2, '0')}`;

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen flex flex-col';

    return () => {
      document.body.className = previousBodyClass;
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [resendCooldown]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmail(verificationCode);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || authLoading) return;

    setError('');
    try {
      await resendCode(email);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendCooldown(120);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    }
  };

  const handleChangeEmail = () => {
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AuthNavbar />

      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden mt-16">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-surface-container-high/40 rounded-full blur-[120px]"></div>
        </div>

        <div
          className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 relative z-10"
          style={{ boxShadow: '0 8px 24px rgba(27, 27, 33, 0.06)' }}
        >
          {/* Brand & Icon Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-surface-container-low rounded-full mb-6">
              <span
                className="material-symbols-outlined text-4xl text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mark_email_read
              </span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-primary mb-3">
              Verify your .edu
            </h1>
            <p className="font-body text-base text-on-surface-variant">
              We've sent a 6-digit code to <span className="font-semibold text-on-surface">{email}</span>. Please enter it below to join the stash.
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Code Input Area */}
            <div>
              <label className="sr-only" htmlFor="code-1">
                Verification Code
              </label>
              <div className="flex justify-center gap-2" dir="ltr">
                {code.map((digit, index) => (
                  <div key={index} className="contents">
                    {index === 3 && (
                      <div className="w-2 flex items-center justify-center text-outline-variant font-bold" aria-hidden="true">
                        -
                      </div>
                    )}
                    <input
                      ref={(el) => (inputRefs.current[index] = el)}
                      id={`code-${index + 1}`}
                      aria-label={`Digit ${index + 1}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      placeholder="•"
                      className="w-12 h-14 text-center font-headline text-2xl font-bold bg-surface-container-low border-none rounded focus:ring-2 focus:ring-surface-tint focus:outline-none text-on-surface transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-center text-error font-body text-sm bg-error-container/10 p-3 rounded">
                {error}
              </div>
            )}

            {/* Primary Action */}
            <button
              type="submit"
              disabled={isVerifying || authLoading}
              className="w-full h-12 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="mt-8 pt-6 border-t border-surface-container-high/50 flex flex-col items-center gap-4">
            <p className="font-label text-sm text-on-surface-variant text-center">
              Didn't receive the code? Check your spam folder or
            </p>
            {resendCooldown > 0 && (
              <p className="font-label text-xs text-on-surface-variant text-center">
                You can resend code in {cooldownLabel}.
              </p>
            )}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend}
              className={`text-primary font-semibold transition-colors inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                canResend ? 'hover:text-tertiary-fixed' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[1rem]">refresh</span>
              Resend Code
            </button>
            <button
              type="button"
              onClick={handleChangeEmail}
              className="font-label text-sm text-outline hover:text-primary transition-colors flex items-center gap-1 mt-2"
            >
              <span className="material-symbols-outlined text-[1rem]">arrow_back</span>
              Change email address
            </button>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
