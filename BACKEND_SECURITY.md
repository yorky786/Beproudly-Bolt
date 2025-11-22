# BeProudly Backend Security Documentation

## Overview

This document details the comprehensive backend security infrastructure implemented for BeProudly, including edge functions, database triggers, and automated security monitoring.

## Backend Architecture

### 1. Edge Functions (Serverless API Endpoints)

All edge functions are deployed with JWT verification enabled and implement the following security patterns:

#### Deployed Edge Functions

1. **secure-message-handler** (`/functions/v1/secure-message-handler`)
   - Purpose: Handle message sending with validation and rate limiting
   - Authentication: Required (JWT)
   - Rate Limit: 20 messages per minute
   - Features:
     - Content length validation (max 2000 chars)
     - Content sanitization
     - Match validation (ensures users are matched)
     - Server-side rate limiting
     - Audit logging

2. **secure-like-handler** (`/functions/v1/secure-like-handler`)
   - Purpose: Handle like/unlike actions with security checks
   - Authentication: Required (JWT)
   - Rate Limit: 50 likes per minute
   - Features:
     - Prevents self-liking
     - Block validation (prevents liking blocked users)
     - Duplicate detection
     - Automatic match creation on reciprocal like
     - Rate limiting
     - Audit logging

3. **security-monitor** (`/functions/v1/security-monitor`)
   - Purpose: Log and retrieve security events
   - Authentication: Required (JWT)
   - Methods: POST (log event), GET (retrieve events)
   - Features:
     - Centralized security event logging
     - User-specific event retrieval
     - Severity classification
     - Metadata storage

4. **report-handler** (`/functions/v1/report-handler`)
   - Purpose: Handle user reports securely
   - Authentication: Required (JWT)
   - Rate Limit: 5 reports per hour
   - Features:
     - Reason validation
     - Duplicate report prevention
     - Prevents self-reporting
     - Automatic security event creation
     - Rate limiting

### 2. Database-Level Security

#### Audit Logging System

**Table: `audit_logs`**
- Automatically logs all critical database operations
- Tracks: INSERT, UPDATE, DELETE operations
- Records:
  - User ID (who performed action)
  - Action type (INSERT/UPDATE/DELETE)
  - Table name
  - Record ID
  - Old data (JSON snapshot before change)
  - New data (JSON snapshot after change)
  - IP address (when available)
  - User agent
  - Timestamp

**Audited Tables:**
- `profiles` - All profile changes
- `matches` - Match creation/updates
- `blocks` - Block actions
- `reports` - User reports

**RLS Policy:**
- Only service role can access audit logs
- Users cannot view or modify logs
- Immutable records

#### Rate Limiting System

**Table: `rate_limits`**
- Server-side rate limit tracking
- Per-user and per-action tracking
- Features:
  - Configurable time windows
  - Automatic expiration
  - Temporary blocking on limit exceeded
  - Attempt counting

**Function: `check_rate_limit()`**
```sql
check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts integer,
  p_window_minutes integer
) RETURNS boolean
```

**Usage in Edge Functions:**
```typescript
const { data: rateLimit } = await supabaseAdmin.rpc('check_rate_limit', {
  p_user_id: user.id,
  p_action: 'send_message',
  p_max_attempts: 20,
  p_window_minutes: 1,
});
```

#### Security Events System

**Table: `security_events`**
- Centralized security event logging
- Severity levels: low, medium, high, critical
- Event types:
  - `rate_limit_exceeded`
  - `blocked_interaction_attempt`
  - `suspicious_activity`
  - `excessive_profile_updates`
  - `user_reported`

**Automatic Triggers:**
- Suspicious activity detection (>50 actions in 5 minutes)
- Excessive profile updates (>10 per hour)
- Rate limit violations
- Blocked user interaction attempts

#### User Action Validation

**Function: `validate_user_action()`**
```sql
validate_user_action(
  p_user_id uuid,
  p_target_user_id uuid
) RETURNS boolean
```

**Features:**
- Checks for blocked relationships
- Logs attempted violations
- Returns false if users have blocked each other
- Used in edge functions before allowing interactions

#### Automated Security Triggers

1. **Prevent Blocked Matches** (`check_no_blocked_match()`)
   - Prevents match creation if users blocked each other
   - Raises exception if violation attempted

2. **Prevent Blocked Likes** (`check_no_blocked_like()`)
   - Prevents like if users blocked each other
   - Raises exception if violation attempted

3. **Audit Logging** (`log_audit_event()`)
   - Automatically logs all critical operations
   - Captures before/after snapshots
   - Includes user context

4. **Suspicious Activity Detection** (`detect_suspicious_activity()`)
   - Monitors audit logs for patterns
   - Flags >50 actions in 5 minutes
   - Logs high-severity security event

5. **Profile Update Tracking** (`track_profile_update()`)
   - Tracks update frequency per user
   - Flags excessive updates (>10/hour)
   - Logs security event on abuse

6. **Automatic Profile Creation** (`create_profile_for_user()`)
   - Creates profile on user signup
   - Initializes flames account
   - Prevents manual profile creation exploits

### 3. Edge Function Security Patterns

All edge functions follow these security patterns:

#### 1. CORS Headers
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};
```

#### 2. JWT Authentication
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: corsHeaders }
  );
}
```

#### 3. Input Validation
```typescript
if (!requiredField) {
  return new Response(
    JSON.stringify({ error: 'Missing required fields' }),
    { status: 400, headers: corsHeaders }
  );
}
```

#### 4. Rate Limiting
```typescript
const { data: rateLimit } = await supabaseAdmin.rpc('check_rate_limit', {
  p_user_id: user.id,
  p_action: 'action_name',
  p_max_attempts: 20,
  p_window_minutes: 1,
});

if (!rateLimit) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded' }),
    { status: 429, headers: corsHeaders }
  );
}
```

#### 5. Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Error:', error);
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500, headers: corsHeaders }
  );
}
```

### 4. Security Maintenance

#### Automatic Cleanup

**Function: `cleanup_rate_limits()`**
- Removes expired rate limit records
- Should be called periodically (e.g., via cron job)
- Prevents table bloat

**Recommended Setup:**
```sql
-- Can be called via scheduled edge function or pg_cron
SELECT cleanup_rate_limits();
```

#### Monitoring Security Events

Query unresolved critical events:
```sql
SELECT * FROM security_events
WHERE resolved = false
  AND severity IN ('high', 'critical')
ORDER BY created_at DESC;
```

Query user activity patterns:
```sql
SELECT
  user_id,
  COUNT(*) as event_count,
  array_agg(DISTINCT event_type) as event_types
FROM security_events
WHERE created_at > now() - interval '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY event_count DESC;
```

#### Audit Log Analysis

Recent profile changes:
```sql
SELECT
  user_id,
  action,
  new_data->>'name' as new_name,
  created_at
FROM audit_logs
WHERE table_name = 'profiles'
  AND action = 'UPDATE'
ORDER BY created_at DESC
LIMIT 50;
```

## Rate Limit Configuration

| Action | Max Attempts | Window | Edge Function |
|--------|-------------|--------|---------------|
| Send Message | 20 | 1 minute | secure-message-handler |
| Like Profile | 50 | 1 minute | secure-like-handler |
| Submit Report | 5 | 1 hour | report-handler |
| Profile Update | 10 | 1 hour | Database Trigger |

## Security Best Practices

### For Backend Development

1. **Always Verify JWT**
   - Never trust client-provided user IDs
   - Always use `supabase.auth.getUser()` to verify identity

2. **Use Service Role Carefully**
   - Only use service role key for privileged operations
   - Always validate user permissions first
   - Log all service role operations

3. **Implement Rate Limiting**
   - All user-triggered actions should be rate limited
   - Use database-level rate limiting for consistency
   - Different limits for different actions

4. **Validate All Inputs**
   - Type checking
   - Length limits
   - Format validation
   - Sanitization

5. **Log Security Events**
   - Log all suspicious activity
   - Include relevant metadata
   - Use appropriate severity levels

6. **Handle Errors Gracefully**
   - Never expose internal details
   - Generic error messages to users
   - Detailed logging for debugging

### For Database Operations

1. **Use Triggers for Consistency**
   - Security checks that must always run
   - Audit logging
   - Data validation

2. **RLS is Mandatory**
   - Every table must have RLS enabled
   - Policies should be restrictive by default
   - Test policies thoroughly

3. **Use Functions for Complex Logic**
   - Reusable security checks
   - Transaction consistency
   - Performance optimization

## Incident Response

### Detecting Security Issues

1. **Monitor Security Events Table**
   - High/critical severity events
   - Unusual patterns
   - Spike in specific event types

2. **Review Audit Logs**
   - Unexpected data changes
   - Bulk operations
   - Failed operations

3. **Check Rate Limits**
   - Users hitting limits frequently
   - Distributed attack patterns

### Response Procedures

1. **Immediate Actions**
   - Identify affected users
   - Block suspicious accounts if needed
   - Preserve evidence (don't delete logs)

2. **Investigation**
   - Review audit logs for timeline
   - Check security events for patterns
   - Identify attack vector

3. **Remediation**
   - Patch vulnerability
   - Reset compromised data
   - Update security measures

4. **Post-Incident**
   - Document findings
   - Update security policies
   - Team training

## Testing Backend Security

### Manual Testing

1. **Authentication Tests**
   ```bash
   # Test without auth header
   curl -X POST https://[project].supabase.co/functions/v1/secure-message-handler

   # Test with invalid JWT
   curl -X POST https://[project].supabase.co/functions/v1/secure-message-handler \
     -H "Authorization: Bearer invalid_token"
   ```

2. **Rate Limit Tests**
   - Send rapid requests
   - Verify rate limit response (429)
   - Check blocked_until timestamp

3. **Validation Tests**
   - Missing required fields
   - Invalid data types
   - Malicious payloads

### Automated Testing

Consider implementing:
- Integration tests for edge functions
- RLS policy tests
- Trigger validation tests
- Rate limit verification tests

## Performance Considerations

1. **Index Optimization**
   - All foreign keys indexed
   - Security query columns indexed
   - Composite indexes where needed

2. **Query Performance**
   - Use `maybeSingle()` for optional rows
   - Limit result sets
   - Avoid N+1 queries

3. **Cleanup Jobs**
   - Regular cleanup of old rate limits
   - Archive old audit logs
   - Resolve old security events

## Compliance & Privacy

1. **Data Retention**
   - Audit logs: Retain for 90 days minimum
   - Security events: Retain until resolved
   - Rate limits: Auto-expire

2. **User Rights**
   - Users can request audit log of their data
   - Support data deletion requests
   - Comply with privacy regulations

## Conclusion

The backend security infrastructure provides multiple layers of protection:
- Authentication and authorization at every endpoint
- Rate limiting to prevent abuse
- Comprehensive audit logging
- Automated threat detection
- Real-time security monitoring

Regular review and updates of these systems are essential to maintain security posture.

**Last Updated:** 2025-11-22
