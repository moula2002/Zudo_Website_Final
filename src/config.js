export const API_BASE_URL = '';
export const API_URL = `${API_BASE_URL}/api`;
export const IMAGE_BASE_URL = 'https://snbtradingco.in';
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

  // Force all uploads to use the current IMAGE_BASE_URL
  // This handles old database entries (e.g. from lightgreen-trout or missing colons)
  const uploadsMatch = cleanUrl.match(/\/uploads\/(.+)/);
  if (uploadsMatch) {
    return `${IMAGE_BASE_URL}/uploads/${uploadsMatch[1]}`;
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

  // 3. If it's a relative path, prepend the IMAGE_BASE_URL
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    const separator = cleanUrl.startsWith('/') ? '' : '/';
    cleanUrl = `${IMAGE_BASE_URL}${separator}${cleanUrl}`;
  }

  return cleanUrl;
};
