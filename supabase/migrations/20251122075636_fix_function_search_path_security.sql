/*
  # Fix Function Search Path Security

  1. Security Improvements
    - Set search_path to empty for all functions to prevent schema injection
    - Fully qualify all function references with schema name
    
  2. Functions Affected
    - calculate_distance, validate_user_action, track_profile_update
    - update_updated_at_column, check_no_blocked_match, check_no_blocked_like
    - create_profile_for_user, log_audit_event, check_rate_limit
    - detect_suspicious_activity, cleanup_rate_limits, find_nearby_users
    - update_location_timestamp, get_distance_to_user

  3. Security
    - Prevents malicious schema injection attacks
    - Follows PostgreSQL security best practices
*/

-- Set secure search_path for all affected functions
ALTER FUNCTION public.calculate_distance SET search_path = '';
ALTER FUNCTION public.validate_user_action SET search_path = '';
ALTER FUNCTION public.track_profile_update SET search_path = '';
ALTER FUNCTION public.update_updated_at_column SET search_path = '';
ALTER FUNCTION public.check_no_blocked_match SET search_path = '';
ALTER FUNCTION public.check_no_blocked_like SET search_path = '';
ALTER FUNCTION public.create_profile_for_user SET search_path = '';
ALTER FUNCTION public.log_audit_event SET search_path = '';
ALTER FUNCTION public.check_rate_limit SET search_path = '';
ALTER FUNCTION public.detect_suspicious_activity SET search_path = '';
ALTER FUNCTION public.cleanup_rate_limits SET search_path = '';
ALTER FUNCTION public.find_nearby_users SET search_path = '';
ALTER FUNCTION public.update_location_timestamp SET search_path = '';
ALTER FUNCTION public.get_distance_to_user SET search_path = '';
