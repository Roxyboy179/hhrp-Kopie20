'use client';

/**
 * IconInput – robuste Input-Komponente mit Icon links und optionalem Action-Button rechts.
 * Nutzt Flex-Layout statt absolute Positioning, damit Icons in allen Viewports/PWA
 * korrekt innerhalb des Inputs zentriert sind.
 */
export function IconInput({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  readOnly = false,
  minLength,
  autoComplete,
  icon: Icon,
  rightAction = null, // { onClick, icon: Icon, label }
  className = '',
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition ${
        disabled || readOnly
          ? 'bg-white/[0.02] border-white/10'
          : 'bg-white/[0.04] border-white/10 focus-within:border-white/25'
      } ${className}`}
    >
      {Icon && (
        <Icon className="w-4 h-4 text-white/30 flex-shrink-0" />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`flex-1 min-w-0 bg-transparent border-0 outline-none text-sm placeholder-white/30 ${
          disabled || readOnly ? 'text-white/70 cursor-not-allowed' : 'text-white'
        }`}
      />
      {rightAction && (
        <button
          type="button"
          onClick={rightAction.onClick}
          aria-label={rightAction.label}
          className="flex-shrink-0 text-white/40 hover:text-white p-1 -mr-1 transition"
        >
          <rightAction.icon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
