-- Add IP address capture to audit logs function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _resource text,
  _resource_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  audit_id uuid;
  current_ip inet;
BEGIN
  -- Try to capture IP from details if not provided
  IF _ip_address IS NULL AND _details ? 'ip_address' THEN
    current_ip := (_details->>'ip_address')::inet;
  ELSE
    current_ip := _ip_address;
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    _action,
    _resource,
    _resource_id,
    _details,
    current_ip,
    _user_agent
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Create trigger to log attack simulations
CREATE OR REPLACE FUNCTION log_attack_to_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the attack to audit logs
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    NEW.target_user_id,
    'ATTACK_DETECTED',
    'quantum_security',
    NEW.id,
    jsonb_build_object(
      'attack_type', NEW.attack_type,
      'severity', NEW.severity,
      'blocked', NEW.is_blocked,
      'detection_method', NEW.detection_method,
      'signature', NEW.attack_signature
    ),
    NEW.source_ip,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on quantum_attack_logs
DROP TRIGGER IF EXISTS trigger_log_attack_to_audit ON quantum_attack_logs;
CREATE TRIGGER trigger_log_attack_to_audit
  AFTER INSERT ON quantum_attack_logs
  FOR EACH ROW
  EXECUTE FUNCTION log_attack_to_audit();