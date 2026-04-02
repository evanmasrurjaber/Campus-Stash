// src/pages/SignupPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const { signup, authLoading } = useAuth();
  const navigate = useNavigate();

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!/^\d{8}$/.test(form.studentId.trim())) {
      setError('Student ID must be exactly 8 digits.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    try {
      await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        studentId: Number(form.studentId),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });

      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Set up your student profile to join CampusStash."
      footer={
        <p className="text-sm text-on-surface-variant">
          Already have an account?
          <Link className="text-primary font-bold hover:underline ml-1" to="/login">
            Log In
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthField
          id="fullName"
          name="fullName"
          label="Full Name"
          icon="person"
          placeholder="Evan Jaber"
          value={form.fullName}
          onChange={onChange}
          autoComplete="name"
          minLength={2}
          maxLength={100}
        />

        <AuthField
          id="email"
          name="email"
          label="University Email"
          icon="mail"
          type="email"
          placeholder="student@g.bracu.ac.bd"
          value={form.email}
          onChange={onChange}
          autoComplete="email"
        />

        <AuthField
          id="studentId"
          name="studentId"
          label="Student ID"
          icon="badge"
          type="text"
          placeholder="12345678"
          value={form.studentId}
          onChange={onChange}
          inputMode="numeric"
          minLength={8}
          maxLength={8}
        />

        <AuthField
          id="phoneNumber"
          name="phoneNumber"
          label="Phone Number"
          icon="phone"
          type="tel"
          placeholder="01XXXXXXXXX"
          value={form.phoneNumber}
          onChange={onChange}
          autoComplete="tel"
        />

        <AuthField
          id="password"
          name="password"
          label="Password"
          icon="lock"
          type="password"
          placeholder="At least 8 chars, uppercase, lowercase, number, symbol"
          value={form.password}
          onChange={onChange}
          autoComplete="new-password"
        />

        <AuthField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          icon="lock"
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={onChange}
          autoComplete="new-password"
        />

        <p className="text-xs text-on-surface-variant px-1">
          Use your university email. Backend currently enforces the BRAC student domain.
        </p>

        {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

        <button
          className="w-full academic-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary-container/20 active:scale-[0.98] transition-all disabled:opacity-60"
          type="submit"
          disabled={authLoading}
        >
          {authLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}