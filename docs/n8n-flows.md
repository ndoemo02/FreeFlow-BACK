# n8n Workflows for FreeFlow

This document describes the n8n workflows for monitoring and alerting the FreeFlow API.

## Prerequisites

- n8n instance running (self-hosted or cloud)
- Webhook access to GitHub repository
- Email configuration for alerts
- Access to FreeFlow API endpoints

## Workflow 1: Nightly API Smoke Test

### Description
Runs every night at 3:00 AM to perform basic health checks on the FreeFlow API.

### Schedule
- **Cron Expression:** `0 3 * * *` (3:00 AM daily)
- **Timezone:** UTC

### Tests Performed
1. **Health Check:** `GET /api/health`
2. **Places Search:** `GET /api/places?query=pizza&n=2&language=pl`
3. **Agent Test:** `POST /api/agent` with `{"text":"ping"}`

### Configuration
- **API Base URL:** `https://freeflow-backend.vercel.app` (production) or `http://localhost:3002` (dev)
- **Timeout:** 30 seconds per request
- **Retry:** 2 attempts on failure

### Alert Conditions
- Any endpoint returns status >= 400
- Response time > 10 seconds
- Any test fails after retries

### Actions on Failure
- Send email alert to admin
- Log failure details
- Create GitHub issue (optional)

## Workflow 2: Key Watch - Secret Detection

### Description
Monitors GitHub webhooks for potential secret leaks in code commits.

### Trigger
- **Event:** GitHub Push Webhook
- **Branches:** main, develop
- **File Types:** All code files

### Detection Patterns
- OpenAI API keys: `sk-[a-zA-Z0-9]{48}`
- Google API keys: `AIza[0-9A-Za-z\\-_]{35}`
- JWT tokens: `eyJ[a-zA-Z0-9_=]+\\.[a-zA-Z0-9_=]+\\.[a-zA-Z0-9_\\-\\+\\/=]*`
- AWS keys: `AKIA[0-9A-Z]{16}`
- OAuth tokens: `ya29\\.[0-9A-Za-z\\-_]+`

### Actions on Detection
- Send immediate email alert
- Comment on PR (if applicable)
- Log incident details
- Notify security team

## Setup Instructions

### 1. Import Workflows
1. Copy the JSON from `n8n-export.json`
2. In n8n, go to Workflows → Import
3. Paste the JSON content
4. Save and activate workflows

### 2. Configure Credentials
1. **GitHub Webhook:** Add GitHub personal access token
2. **Email:** Configure SMTP settings
3. **API Access:** Add FreeFlow API credentials

### 3. Set Environment Variables
```bash
# API Configuration
FREEFLOW_API_BASE=https://freeflow-backend.vercel.app
FREEFLOW_API_KEY=your_api_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@freeflow.com
SMTP_PASS=your_app_password

# GitHub Configuration
GITHUB_TOKEN=your_github_token
GITHUB_REPO=freeflow/backend
```

### 4. Test Workflows
1. **Smoke Test:** Run manually to verify API connectivity
2. **Key Watch:** Test with a dummy commit containing a fake key
3. **Email Alerts:** Verify email delivery

## Monitoring Dashboard

### Key Metrics
- API uptime percentage
- Average response times
- Error rates by endpoint
- Secret detection incidents

### Alerts
- **Critical:** API down, secrets detected
- **Warning:** High response times, test failures
- **Info:** Successful tests, deployments

## Troubleshooting

### Common Issues
1. **API Timeout:** Check network connectivity and API status
2. **Email Delivery:** Verify SMTP credentials and firewall settings
3. **Webhook Failures:** Check GitHub webhook configuration
4. **False Positives:** Update detection patterns for known safe strings

### Logs
- Check n8n execution logs for detailed error information
- Monitor API logs for request patterns
- Review email delivery logs

## Maintenance

### Weekly Tasks
- Review alert patterns and adjust thresholds
- Update detection patterns if needed
- Check workflow execution history

### Monthly Tasks
- Rotate API keys and credentials
- Review and update email templates
- Analyze performance trends

## Security Considerations

- Store all credentials in n8n credential store
- Use environment variables for configuration
- Regularly rotate API keys and tokens
- Monitor access logs for suspicious activity
- Keep n8n instance updated and patched
