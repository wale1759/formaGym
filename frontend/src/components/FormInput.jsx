import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function FormInput({
  type = 'text',
  passwordLabel = 'password',
  ...props
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  if (type !== 'password') {
    return <input {...props} type={type} />;
  }
  return (
    <span className="password-field">
      <input {...props} type={passwordVisible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        aria-label={`${passwordVisible ? 'Hide' : 'Show'} ${passwordLabel.toLowerCase()}`}
        aria-pressed={passwordVisible}
        aria-controls={props.id}
        disabled={props.disabled}
        onClick={() => setPasswordVisible((isVisible) => !isVisible)}
      >
        {passwordVisible ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </span>
  );
}
