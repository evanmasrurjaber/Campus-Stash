import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    safety: false,
  });
  const [error, setError] = useState('');

  const { signup, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen';
    return () => {
      document.body.className = previousBodyClass;
    };
  }, []);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const studentId = form.studentId.trim();
    const phoneNumber = form.phoneNumber.trim();

    if (!fullName) {
      setError('Full name is required.');
      return;
    }

    if (!/^[^\s@]+@g\.bracu\.ac\.bd$/.test(email)) {
      setError('Use a valid BRAC university email address.');
      return;
    }

    if (!/^\d{8}$/.test(studentId)) {
      setError('Student ID must be exactly 8 digits.');
      return;
    }

    if (!phoneNumber) {
      setError('Phone number is required.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    if (!form.safety) {
      setError('You must agree to the safety guidelines and code of conduct.');
      return;
    }

    try {
      await signup({
        fullName,
        email,
        studentId: Number(studentId),
        phoneNumber,
        password: form.password,
      });

      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Signup failed');
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full flex justify-between items-center px-6 py-4 bg-[#fbf8ff]/70 backdrop-blur-md z-50">
        <Link to="/login" className="text-xl font-extrabold text-[#000666] tracking-tighter font-headline">
          CampusStash
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <a className="text-[#1b1b21]/60 font-label text-sm hover:text-[#000666] transition-colors" href="mailto:support@campusstash.com">
            Help
          </a>
          <Link
            className="academic-gradient text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm scale-100 active:scale-95 transition-transform"
            to="/login"
          >
            Login
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-32 px-6 flex flex-col lg:flex-row items-center justify-center min-h-screen gap-12 max-w-7xl mx-auto">
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high w-fit">
            <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
              Secure Academic Network
            </span>
          </div>

          <h1 className="font-headline font-extrabold text-4xl md:text-5xl lg:text-6xl text-primary tracking-tight leading-[1.1]">
            Join the <span className="text-on-primary-container">Campus Community</span>
          </h1>

          <p className="text-on-surface-variant text-lg max-w-md">
            Your exclusive marketplace for campus living. Buy, sell, and find lost items with trusted peers from your university.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
              <span className="material-symbols-outlined text-secondary">school</span>
              <span className="font-bold text-sm">EDU Verified</span>
              <span className="text-xs text-on-surface-variant">Exclusive to students and faculty.</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
              <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_person
              </span>
              <span className="font-bold text-sm">Safe Exchange</span>
              <span className="text-xs text-on-surface-variant">On-campus meetups for maximum safety.</span>
            </div>
          </div>
        </div>

        <div className="w-full md:max-w-xl lg:w-1/2">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(27,27,33,0.06)] border-outline-variant/20 border">
            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">person</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 transition-all"
                    id="fullName"
                    name="fullName"
                    placeholder="Alex Taylor"
                    type="text"
                    value={form.fullName}
                    onChange={onChange}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="email">
                  EDU Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">alternate_email</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 transition-all"
                    id="email"
                    name="email"
                    placeholder="student@g.bracu.ac.bd"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    autoComplete="email"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant italic mt-1 px-1">
                  Only BRAC domain email is accepted by backend validation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="studentId">
                    Student ID
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">badge</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 transition-all"
                      id="studentId"
                      name="studentId"
                      placeholder="12345678"
                      type="text"
                      value={form.studentId}
                      onChange={onChange}
                      required
                      minLength={8}
                      maxLength={8}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="phoneNumber">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">phone</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 transition-all"
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="01XXXXXXXXX"
                      type="tel"
                      value={form.phoneNumber}
                      onChange={onChange}
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="password">
                    Create Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">lock</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 transition-all"
                      id="password"
                      name="password"
                      placeholder="At least 8 chars with uppercase, lowercase, number, symbol"
                      type="password"
                      value={form.password}
                      onChange={onChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">shield_lock</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 transition-all"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={onChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-2 px-1">
                <input
                  className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/30 transition-all"
                  id="safety"
                  name="safety"
                  type="checkbox"
                  checked={form.safety}
                  onChange={onChange}
                  required
                />
                <label className="text-sm text-on-surface-variant leading-tight" htmlFor="safety">
                  I agree to the <a className="text-primary font-bold hover:underline" href="#">Student Safety Guidelines</a> and the campus code of conduct.
                </label>
              </div>

              {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

              <button
                className="mt-4 w-full academic-gradient text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-lg disabled:opacity-60"
                type="submit"
                disabled={authLoading}
              >
                {authLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="mt-4 flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-[1px] bg-outline-variant/30 flex-grow"></div>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">or</span>
                  <div className="h-[1px] bg-outline-variant/30 flex-grow"></div>
                </div>

                <p className="text-sm text-on-surface-variant">
                  Already part of the stash?{' '}
                  <Link className="text-primary font-bold hover:underline" to="/login">
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full md:hidden flex justify-around items-center p-4 bg-[#fbf8ff]/70 backdrop-blur-md z-50 rounded-t-2xl shadow-[0_-8px_24px_rgba(27,27,33,0.06)]">
        <Link className="flex flex-col items-center justify-center text-[#1b1b21]/60 px-6 py-2 transition-all" to="/login">
          <span className="material-symbols-outlined">login</span>
          <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">Login</span>
        </Link>
        <span className="flex flex-col items-center justify-center academic-gradient text-white rounded-xl px-6 py-2 scale-110">
          <span className="material-symbols-outlined">person_add</span>
          <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">Sign Up</span>
        </span>
      </div>
    </>
  );
}