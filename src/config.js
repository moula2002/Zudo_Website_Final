export const API_BASE_URL = 'https://lightgreen-trout-176417.hostingersite.com';
export const API_URL = `${API_BASE_URL}/api`;
export const IMAGE_BASE_URL = 'https://lightgreen-trout-176417.hostingersite.com';
export const UPLOAD_URL = `${API_BASE_URL}/api/upload`;

export const cleanImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  let cleanUrl = url.trim();

  // Rewrite broken via.placeholder.com references to beautiful, high-quality, fast Unsplash images
  if (cleanUrl.includes('via.placeholder.com')) {
    if (cleanUrl.toLowerCase().includes('category')) {
      return 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=200';
    }
    // Return high-quality, organic food placeholder
    return 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600';
  }

  // Handle user-uploaded files locally to prevent CORS block issues
  const isUserUpload = cleanUrl.includes('/uploads/file-') || cleanUrl.includes('uploads/file-');
  if (isUserUpload) {
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      const separator = cleanUrl.startsWith('/') ? '' : '/';
      return `${API_BASE_URL}${separator}${cleanUrl}`;
    }
    return cleanUrl;
  }

  // Replace localhost references with the production base URL
  if (cleanUrl.includes('localhost:5000')) {
    cleanUrl = cleanUrl.replace(/https?:\/\/localhost:5000/g, IMAGE_BASE_URL);
    cleanUrl = cleanUrl.replace(/localhost:5000/g, IMAGE_BASE_URL);
  }

  // 1. If there are multiple occurrences of 'http' or 'https', keep only the last one.
  const lastHttpIndex = Math.max(
    cleanUrl.lastIndexOf('https://'),
    cleanUrl.lastIndexOf('http://'),
    cleanUrl.lastIndexOf('https//'),
    cleanUrl.lastIndexOf('http//')
  );

  if (lastHttpIndex > 0) {
    cleanUrl = cleanUrl.substring(lastHttpIndex);
  }

  // 2. Fix missing colon in 'https//' or 'http//'
  if (cleanUrl.startsWith('https//')) {
    cleanUrl = 'https://' + cleanUrl.substring(7);
  } else if (cleanUrl.startsWith('http//')) {
    cleanUrl = 'http://' + cleanUrl.substring(6);
  }

  // 3. If it's a relative path starting with '/uploads' or 'uploads', prepend the IMAGE_BASE_URL
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    const separator = cleanUrl.startsWith('/') ? '' : '/';
    cleanUrl = `${IMAGE_BASE_URL}${separator}${cleanUrl}`;
  }

  return cleanUrl;
};
