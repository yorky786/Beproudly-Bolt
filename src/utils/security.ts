import { supabase } from '../lib/supabase';

export const RATE_LIMIT_CONFIG = {
  MESSAGE_SEND: { maxAttempts: 10, windowMs: 60000 },
  LIKE_ACTION: { maxAttempts: 20, windowMs: 60000 },
  PROFILE_UPDATE: { maxAttempts: 5, windowMs: 300000 },
  VIDEO_UPLOAD: { maxAttempts: 3, windowMs: 3600000 },
};

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const checkRateLimit = (
  userId: string,
  action: keyof typeof RATE_LIMIT_CONFIG
): { allowed: boolean; resetIn?: number } => {
  const config = RATE_LIMIT_CONFIG[action];
  const key = `${userId}:${action}`;
  const now = Date.now();

  if (!rateLimitStore[key] || now > rateLimitStore[key].resetTime) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return { allowed: true };
  }

  if (rateLimitStore[key].count >= config.maxAttempts) {
    const resetIn = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
    return { allowed: false, resetIn };
  }

  rateLimitStore[key].count++;
  return { allowed: true };
};

export const clearRateLimit = (userId: string, action: keyof typeof RATE_LIMIT_CONFIG) => {
  const key = `${userId}:${action}`;
  delete rateLimitStore[key];
};

export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const checkUserBlocked = async (userId: string, targetUserId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${userId})`)
    .maybeSingle();

  return !!data;
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 255);
};

export const generateSecureFilename = (userId: string, originalFilename: string): string => {
  const ext = originalFilename.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${userId}/${timestamp}_${random}.${ext}`;
};

export const logSecurityEvent = async (
  userId: string,
  eventType: string,
  details: Record<string, any>
) => {
  console.warn('[SECURITY EVENT]', {
    userId,
    eventType,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export const validateSessionAge = (session: any): boolean => {
  if (!session?.expires_at) return false;
  return new Date(session.expires_at * 1000) > new Date();
};

export const detectSuspiciousActivity = (
  actions: string[],
  timeWindowMs: number = 60000
): boolean => {
  const rapidActions = actions.filter(
    (_, index) => index > 0 && Date.now() - Number(actions[index - 1]) < 1000
  );
  return rapidActions.length > 5;
};

export const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const verifyContentSafety = (content: string): { safe: boolean; reason?: string } => {
  const bannedPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ];

  for (const pattern of bannedPatterns) {
    if (pattern.test(content)) {
      return { safe: false, reason: 'Potentially malicious content detected' };
    }
  }

  return { safe: true };
};

export const checkContentModeration = (content: string): { flagged: boolean; reason?: string } => {
  const explicitPatterns = [
    /\b(spam|scam|phishing)\b/i,
  ];

  for (const pattern of explicitPatterns) {
    if (pattern.test(content)) {
      return { flagged: true, reason: 'Content requires moderation' };
    }
  }

  return { flagged: false };
};
