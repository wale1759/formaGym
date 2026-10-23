import sharp from 'sharp';
export const maxPhotoBytes = 5 * 1024 * 1024;
export const photoTypes = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
export async function validatePhoto(buffer, contentType) {
  if (!photoTypes[contentType]) throw Object.assign(new Error('Choose a JPEG, PNG or WebP image.'), { status: 415 });
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw Object.assign(new Error('Choose an image to upload.'), { status: 400 });
  if (buffer.length > maxPhotoBytes) throw Object.assign(new Error('The image must be 5 MB or smaller.'), { status: 413 });
  try {
    const image = sharp(buffer, { limitInputPixels: 20000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (metadata.format !== photoTypes[contentType] || (metadata.pages || 1) > 1) throw new Error('Unsupported image.');
    if (metadata.width < 96 || metadata.height < 96) throw Object.assign(new Error('Choose an image at least 96 × 96 pixels.'), { status: 400 });
    return await image.rotate().resize(512, 512, { fit: 'cover' }).flatten({ background: '#1a1d23' }).jpeg({ quality: 85 }).toBuffer();
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error('This image is invalid, damaged, animated or too large to process. Choose a still JPEG, PNG or WebP image under 20 megapixels.'), { status: 400 });
  }
}
