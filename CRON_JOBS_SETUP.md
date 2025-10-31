# Setting Up Cron Jobs for Background Security Tasks

## Overview

To enable periodic security monitoring, you need to set up cron jobs that call the edge functions automatically.

## Prerequisites

✅ Already enabled in migration:
- `pg_cron` extension
- `pg_net` extension

## Cron Jobs to Create

### 1. Trust Score Calculation (Every 6 hours)

Run this SQL in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'calculate-trust-scores-periodic',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT
    net.http_post(
      url:='https://sehwyxblppthfjlndgnq.supabase.co/functions/v1/calculate-trust-scores',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHd5eGJscHB0aGZqbG5kZ25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTQ4NDgsImV4cCI6MjA3NTY5MDg0OH0.p5HMPONt6UYK3mfuuZhXZbkHczCdXsu01qcRxXBt3-0"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);
```

### 2. Anomaly Detection (Every 1 hour)

```sql
SELECT cron.schedule(
  'detect-anomalies-periodic',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
      url:='https://sehwyxblppthfjlndgnq.supabase.co/functions/v1/detect-anomalies',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHd5eGJscHB0aGZqbG5kZ25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTQ4NDgsImV4cCI6MjA3NTY5MDg0OH0.p5HMPONt6UYK3mfuuZhXZbkHczCdXsu01qcRxXBt3-0"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);
```

## Verify Cron Jobs

Check if cron jobs are scheduled:

```sql
SELECT * FROM cron.job;
```

## View Cron Job History

```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

## Manually Trigger Edge Functions (Testing)

### Generate Quantum Keys for a User

```bash
curl -X POST https://sehwyxblppthfjlndgnq.supabase.co/functions/v1/generate-quantum-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHd5eGJscHB0aGZqbG5kZ25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTQ4NDgsImV4cCI6MjA3NTY5MDg0OH0.p5HMPONt6UYK3mfuuZhXZbkHczCdXsu01qcRxXBt3-0" \
  -d '{"userId": "YOUR_USER_ID_HERE"}'
```

### Calculate Trust Scores

```bash
curl -X POST https://sehwyxblppthfjlndgnq.supabase.co/functions/v1/calculate-trust-scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHd5eGJscHB0aGZqbG5kZ25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTQ4NDgsImV4cCI6MjA3NTY5MDg0OH0.p5HMPONt6UYK3mfuuZhXZbkHczCdXsu01qcRxXBt3-0"
```

### Detect Anomalies

```bash
curl -X POST https://sehwyxblppthfjlndgnq.supabase.co/functions/v1/detect-anomalies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHd5eGJscHB0aGZqbG5kZ25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTQ4NDgsImV4cCI6MjA3NTY5MDg0OH0.p5HMPONt6UYK3mfuuZhXZbkHczCdXsu01qcRxXBt3-0"
```

## Monitoring

### Check Edge Function Logs

View logs in Supabase Dashboard:
- Go to Edge Functions
- Click on function name
- View "Logs" tab

### Check Audit Logs

```sql
SELECT * FROM audit_logs 
WHERE action IN ('TRUST_SCORE_BATCH_CALCULATION', 'ANOMALY_DETECTION_COMPLETED')
ORDER BY created_at DESC
LIMIT 50;
```

## Schedule Customization

Adjust the cron schedule as needed:

- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday

## Disable Cron Jobs

If needed to disable:

```sql
SELECT cron.unschedule('calculate-trust-scores-periodic');
SELECT cron.unschedule('detect-anomalies-periodic');
```

## Re-enable Cron Jobs

Just run the schedule commands again with the same job name - it will update the existing job.
