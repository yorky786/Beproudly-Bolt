import { supabase } from '../lib/supabase';

export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  INVALID_INPUT = 'invalid_input',
  FILE_UPLOAD_REJECTED = 'file_upload_rejected',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  logEvent(event: Omit<SecurityEvent, 'timestamp' | 'userAgent'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    this.events.push(fullEvent);

    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    if (event.severity === 'high' || event.severity === 'critical') {
      this.alertAdmin(fullEvent);
    }

    console.warn('[SECURITY]', fullEvent);
  }

  logFailedLogin(email: string, reason: string): void {
    this.logEvent({
      type: SecurityEventType.FAILED_LOGIN,
      details: { email, reason },
      severity: 'medium',
    });
  }

  logSuspiciousActivity(userId: string, activity: string, details: Record<string, any>): void {
    this.logEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId,
      details: { activity, ...details },
      severity: 'high',
    });
  }

  logRateLimitExceeded(userId: string, action: string): void {
    this.logEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      userId,
      details: { action },
      severity: 'medium',
    });
  }

  logUnauthorizedAccess(userId: string | undefined, resource: string): void {
    this.logEvent({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      userId,
      details: { resource },
      severity: 'high',
    });
  }

  logInvalidInput(userId: string | undefined, field: string, value: any): void {
    this.logEvent({
      type: SecurityEventType.INVALID_INPUT,
      userId,
      details: { field, value: String(value).substring(0, 100) },
      severity: 'low',
    });
  }

  logFileUploadRejected(userId: string, filename: string, reason: string): void {
    this.logEvent({
      type: SecurityEventType.FILE_UPLOAD_REJECTED,
      userId,
      details: { filename, reason },
      severity: 'medium',
    });
  }

  logXSSAttempt(userId: string | undefined, input: string): void {
    this.logEvent({
      type: SecurityEventType.XSS_ATTEMPT,
      userId,
      details: { input: input.substring(0, 200) },
      severity: 'critical',
    });
  }

  private alertAdmin(event: SecurityEvent): void {
    console.error('[SECURITY ALERT]', event);
  }

  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByUser(userId: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter((e) => e.userId === userId)
      .slice(-limit);
  }

  getEventsBySeverity(severity: SecurityEvent['severity'], limit: number = 50): SecurityEvent[] {
    return this.events
      .filter((e) => e.severity === severity)
      .slice(-limit);
  }

  async persistSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      console.log('Security event logged:', event);
    } catch (error) {
      console.error('Failed to persist security event:', error);
    }
  }
}

export const securityMonitor = new SecurityMonitor();

export const withSecurityMonitoring = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: string
): T => {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error.message?.includes('auth') || error.message?.includes('permission')) {
        securityMonitor.logUnauthorizedAccess(undefined, action);
      }

      if (duration > 10000) {
        securityMonitor.logSuspiciousActivity(
          'unknown',
          'slow_operation',
          { action, duration }
        );
      }

      throw error;
    }
  }) as T;
};

export const trackUserActivity = (userId: string, activity: string, metadata: Record<string, any> = {}) => {
  const activityLog = {
    userId,
    activity,
    metadata,
    timestamp: new Date().toISOString(),
  };

  const recentActivities = JSON.parse(
    localStorage.getItem('recent_activities') || '[]'
  );

  recentActivities.push(activityLog);

  if (recentActivities.length > 100) {
    recentActivities.shift();
  }

  localStorage.setItem('recent_activities', JSON.stringify(recentActivities));

  const timestamps = recentActivities
    .filter((a: any) => a.userId === userId)
    .map((a: any) => new Date(a.timestamp).getTime());

  if (timestamps.length > 20) {
    const recentTimestamps = timestamps.slice(-20);
    const avgTimeDiff = recentTimestamps.reduce((acc: number, t: number, i: number) => {
      if (i === 0) return acc;
      return acc + (t - recentTimestamps[i - 1]);
    }, 0) / (recentTimestamps.length - 1);

    if (avgTimeDiff < 100) {
      securityMonitor.logSuspiciousActivity(
        userId,
        'rapid_requests',
        { avgTimeDiff, count: timestamps.length }
      );
    }
  }
};
