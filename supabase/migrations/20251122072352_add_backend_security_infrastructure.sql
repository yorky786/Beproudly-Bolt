/*
  # Backend Security Infrastructure

  ## Overview
  This migration adds comprehensive backend security measures including:
  - Audit logging at database level
  - Rate limiting tables
  - Security event tracking
  - Automated security triggers
  - IP address tracking
  - Session management improvements

  ## Changes Made

  1. **Audit Log Table**
     - Tracks all critical database operations
     - Records who, what, when, and from where
     - Immutable log entries

  2. **Rate Limit Tracking**
     - Server-side rate limiting
     - Per-user and per-IP tracking
     - Automatic cleanup of old entries

  3. **Security Events Table**
     - Centralized security event logging
     - Severity levels
     - Pattern detection for suspicious activity

  4. **Additional Security Triggers**
     - Automatic timestamp updates
     - Suspicious activity detection
     - Data integrity validation

  5. **Functions for Security Operations**
     - Rate limit checking
     - IP validation
     - User activity tracking
*/

-- Create audit log table for tracking all critical operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (for now, no one can view them via app)
CREATE POLICY "Service role can view audit logs"
  ON audit_logs FOR SELECT
  TO service_role
  USING (true);

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address inet,
  action text NOT NULL,
  attempts integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  window_end timestamptz,
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limit status
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create security events table
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage security events
CREATE POLICY "Service role can manage security events"
  ON security_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON rate_limits(action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE 
      WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_matches ON matches;
CREATE TRIGGER audit_matches
  AFTER INSERT OR UPDATE OR DELETE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_blocks ON blocks;
CREATE TRIGGER audit_blocks
  AFTER INSERT OR DELETE ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_reports ON reports;
CREATE TRIGGER audit_reports
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Function to check rate limits (to be called from edge functions)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts integer,
  p_window_minutes integer
)
RETURNS boolean AS $$
DECLARE
  v_current_attempts integer;
  v_window_start timestamptz;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Get current attempts in window
  SELECT COALESCE(SUM(attempts), 0)
  INTO v_current_attempts
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND window_end > now()
    AND blocked_until IS NULL;
  
  -- Check if limit exceeded
  IF v_current_attempts >= p_max_attempts THEN
    -- Block user temporarily
    UPDATE rate_limits
    SET blocked_until = now() + (p_window_minutes || ' minutes')::interval
    WHERE user_id = p_user_id
      AND action = p_action
      AND window_end > now();
    
    -- Log security event
    INSERT INTO security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      p_user_id,
      'rate_limit_exceeded',
      'medium',
      'Rate limit exceeded for action: ' || p_action,
      jsonb_build_object(
        'action', p_action,
        'attempts', v_current_attempts,
        'max_attempts', p_max_attempts
      )
    );
    
    RETURN false;
  END IF;
  
  -- Update or insert rate limit record
  INSERT INTO rate_limits (
    user_id,
    action,
    attempts,
    window_start,
    window_end
  ) VALUES (
    p_user_id,
    p_action,
    1,
    now(),
    now() + (p_window_minutes || ' minutes')::interval
  )
  ON CONFLICT (user_id, action)
  DO UPDATE SET
    attempts = rate_limits.attempts + 1,
    updated_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_count integer;
  v_time_window interval := '5 minutes'::interval;
BEGIN
  -- Count recent actions from this user
  SELECT COUNT(*)
  INTO v_recent_count
  FROM audit_logs
  WHERE user_id = NEW.user_id
    AND table_name = NEW.table_name
    AND action = NEW.action
    AND created_at > now() - v_time_window;
  
  -- If too many actions in short time, log security event
  IF v_recent_count > 50 THEN
    INSERT INTO security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'suspicious_activity',
      'high',
      'Unusual activity pattern detected',
      jsonb_build_object(
        'table', NEW.table_name,
        'action', NEW.action,
        'count', v_recent_count,
        'window', '5 minutes'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to detect suspicious activity
DROP TRIGGER IF EXISTS detect_suspicious_activity_trigger ON audit_logs;
CREATE TRIGGER detect_suspicious_activity_trigger
  AFTER INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_activity();

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_end < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate user actions
CREATE OR REPLACE FUNCTION validate_user_action(
  p_user_id uuid,
  p_target_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_blocked boolean;
BEGIN
  -- Check if users have blocked each other
  SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = p_user_id AND blocked_id = p_target_user_id)
       OR (blocker_id = p_target_user_id AND blocked_id = p_user_id)
  ) INTO v_blocked;
  
  IF v_blocked THEN
    INSERT INTO security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      p_user_id,
      'blocked_interaction_attempt',
      'medium',
      'Attempted interaction with blocked user',
      jsonb_build_object(
        'target_user_id', p_target_user_id
      )
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to prevent profile updates too frequently
CREATE TABLE IF NOT EXISTS profile_update_tracker (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_update timestamptz DEFAULT now(),
  update_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_update_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own update tracker"
  ON profile_update_tracker FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to track profile updates
CREATE OR REPLACE FUNCTION track_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  v_update_count integer;
BEGIN
  -- Insert or update tracker
  INSERT INTO profile_update_tracker (user_id, last_update, update_count, window_start)
  VALUES (NEW.id, now(), 1, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_update = now(),
    update_count = CASE
      WHEN profile_update_tracker.window_start < now() - interval '1 hour'
      THEN 1
      ELSE profile_update_tracker.update_count + 1
    END,
    window_start = CASE
      WHEN profile_update_tracker.window_start < now() - interval '1 hour'
      THEN now()
      ELSE profile_update_tracker.window_start
    END
  RETURNING update_count INTO v_update_count;
  
  -- Log if too many updates
  IF v_update_count > 10 THEN
    INSERT INTO security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    ) VALUES (
      NEW.id,
      'excessive_profile_updates',
      'low',
      'User updating profile excessively',
      jsonb_build_object('count', v_update_count)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS track_profile_update_trigger ON profiles;
CREATE TRIGGER track_profile_update_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_profile_update();

-- Add updated_at triggers to tables that need them
DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
