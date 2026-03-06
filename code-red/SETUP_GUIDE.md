# DevCollab Setup Guide

## Grok API Setup (For AI Bug Triage)

### Getting Your Grok API Key

1. Sign up at xAI: https://accounts.x.ai/sign-up?redirect=cloud-console
2. Create API Key:
   - Go to https://console.x.ai/team/default/api-keys
   - Click "Create API Key"
   - Name: "DevCollab"
   - Copy the key (format: `xai-...`)
3. Add to `.env`:

```env
GROK_API_KEY=xai-your-key-here
```

### Grok Model Selection

Available models:

- `grok-2` (latest, recommended) - Best balance of speed and quality
- `grok-2-latest` - Always latest version
- `grok-vision` - Multimodal (text + image)

Current setup uses `grok-2`.

### Cost Estimate

For a hackathon (100 bugs created with triage):

- Grok-2: ~$0.02 USD
- Much cheaper than OpenAI

No payment method required if using free tier with limits.
