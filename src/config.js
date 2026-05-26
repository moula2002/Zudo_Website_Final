export const API_BASE_URL = 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;
export const IMAGE_BASE_URL = 'https://lightgreen-trout-176417.hostingersite.com';

export const cleanImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  let cleanUrl = url.trim();

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
