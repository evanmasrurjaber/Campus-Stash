// src/components/auth/AuthField.jsx
export default function AuthField({
  id,
  name,
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete = 'off',
  required = true,
  inputMode,
  minLength,
  maxLength,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1"
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-lg"
          aria-hidden="true"
        >
          {icon}
        </span>
        <input
          id={id}
          name={name || id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          inputMode={inputMode}
          minLength={minLength}
          maxLength={maxLength}
          className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-surface-tint/20 transition-all text-on-surface placeholder:text-outline/50"
        />
      </div>
    </div>
  );
}