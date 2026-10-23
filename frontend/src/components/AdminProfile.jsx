import { useRef, useState } from 'react';

export default function AdminProfile({ profile, onChanged }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function change(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(''); setMessage('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPEG, PNG or WebP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('The image must be 5 MB or smaller.'); return; }
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const valid = bitmap.width >= 96 && bitmap.height >= 96 && bitmap.width * bitmap.height <= 20000000;
      bitmap.close();
      if (!valid) throw new Error('Choose an image at least 96 × 96 pixels and no larger than 20 megapixels.');
      const response = await fetch('/api/admin/profile/photo', { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update your photo.');
      onChanged(result.profile);
      setMessage('Profile picture updated.');
    } catch (error) { setError(error.name === 'InvalidStateError' ? 'This image cannot be read. Choose another file.' : error.message); }
    finally { setBusy(false); }
  }
  return <div className="card admin-profile">
    <div className="admin-photo-controls">
      {profile.photoUrl ? <img className="admin-avatar" src={profile.photoUrl} width="96" height="96" alt="Your administrator profile"/> : <span className="admin-avatar admin-avatar-placeholder" aria-hidden="true">{profile.username.slice(0,1).toUpperCase()}</span>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={change}/>
      <button type="button" className="button secondary change-photo" disabled={busy} onClick={() => input.current?.click()} aria-describedby="profile-photo-help">{busy ? 'Uploading...' : 'Change picture'}</button>
    </div>
    <div><span className="eyebrow">YOUR MANAGEMENT SPACE</span><h2>Welcome back, {profile.username}.</h2><p>{profile.email}</p><p className="fine" id="profile-photo-help">JPEG, PNG or WebP · Up to 5 MB · At least 96 × 96 pixels</p>{error && <p className="error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}</div>
  </div>;
}
