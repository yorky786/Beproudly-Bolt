export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '');
};

export const validateAge = (age: number): boolean => {
  return age >= 18 && age <= 120;
};

export const validateBio = (bio: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(bio, 500);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Bio cannot be empty' };
  }
  if (sanitized.length > 500) {
    return { valid: false, error: 'Bio must be 500 characters or less' };
  }
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name, 50);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (sanitized.length > 50) {
    return { valid: false, error: 'Name must be 50 characters or less' };
  }
  return { valid: true };
};

export const validateLocation = (location: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(location, 100);
  if (sanitized.length > 100) {
    return { valid: false, error: 'Location must be 100 characters or less' };
  }
  return { valid: true };
};

export const validatePronouns = (pronouns: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(pronouns, 50);
  if (sanitized.length > 50) {
    return { valid: false, error: 'Pronouns must be 50 characters or less' };
  }
  return { valid: true };
};

export const validateMessageContent = (content: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(content, 2000);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (sanitized.length > 2000) {
    return { valid: false, error: 'Message must be 2000 characters or less' };
  }
  return { valid: true };
};

export const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateFileSize = (file: File, maxSizeMB: number = 50): { valid: boolean; error?: string } => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }
  return { valid: true };
};

export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only MP4, MOV, and WebM video files are allowed' };
  }

  const sizeValidation = validateFileSize(file, 100);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP image files are allowed' };
  }

  const sizeValidation = validateFileSize(file, 10);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
};

export const escapeHTML = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

export const preventXSS = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
