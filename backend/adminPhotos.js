import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validatePhoto, photoTypes, maxPhotoBytes } from './validation/photo.js';
import { recordActivity } from './database.js';
const originalOwnerPhoto = fileURLToPath(new URL('./data/owner-profile.jpg', import.meta.url));
export async function adminProfile(req, store) {
  const photo = await store.find('profilePhotos', { id: req.adminId });
  return { username: req.adminUsername, email: req.adminEmail, photoUrl: photo ? `/api/admin/profile/photo?v=${encodeURIComponent(photo.updatedAt)}` : req.adminId === 'environment-owner' && existsSync(originalOwnerPhoto) ? '/api/admin/profile/photo' : null };
}
export function registerAdminPhotos(app, store) {
  app.get('/api/admin/profile/photo', async (req, res, next) => {
    try {
      const photo = await store.find('profilePhotos', { id: req.adminId });
      res.set('X-Content-Type-Options', 'nosniff');
      if (photo) return res.type('image/jpeg').send(Buffer.from(photo.data, 'base64'));
      if (req.adminId !== 'environment-owner' || !existsSync(originalOwnerPhoto)) return res.status(404).json({ error: 'Profile photo not found.' });
      res.sendFile(originalOwnerPhoto, { cacheControl: false }, error => { if (error) next(error); });
    } catch (error) { error.photoError = true; next(error); }
  });
  app.put('/api/admin/profile/photo', express.raw({ type: Object.keys(photoTypes), limit: maxPhotoBytes }), async (req, res, next) => {
    try {
      const photo = await validatePhoto(req.body, req.get('Content-Type')?.split(';')[0].trim().toLowerCase());
      await store.put('profilePhotos', req.adminId, { data: photo.toString('base64'), contentType: 'image/jpeg' });
      await recordActivity(store, { actor: 'admin', actorId: req.adminId, email: req.adminEmail, action: 'profile_photo_updated', target: req.adminId });
      res.json({ profile: await adminProfile(req, store) });
    } catch (error) { next(error); }
  });
}
