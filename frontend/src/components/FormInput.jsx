import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function FormInput({ type = 'text', passwordLabel = 'password', ...props }) {
  const [visible, setVisible] = useState(false);
  if (type !== 'password') return <input {...props} type={type}/>;
  return <span className="password-field">
    <input {...props} type={visible ? 'text' : 'password'}/>
    <button type="button" className="password-toggle" aria-label={`${visible ? 'Hide' : 'Show'} ${passwordLabel.toLowerCase()}`} aria-pressed={visible} aria-controls={props.id} disabled={props.disabled} onClick={() => setVisible(current => !current)}>
      {visible ? <EyeOff size={20} aria-hidden="true"/> : <Eye size={20} aria-hidden="true"/>}
    </button>
  </span>;
}
