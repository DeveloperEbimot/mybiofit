# 🚀 BioFit Groq AI Setup Guide

## Overview

This guide walks you through setting up **Groq** as your primary AI provider for BioFit. Groq is the best choice for high-volume fitness apps with millions of users.

### Why Groq?
- ✅ **Unlimited free tier** (30-60 requests/minute)
- ✅ **Ultra-fast inference** (perfect for real-time analysis)
- ✅ **Scales to millions of users**
- ✅ **No credit card required**
- ✅ **99.9%+ uptime**

---

## 📋 Prerequisites

Before starting, you need:
- A Groq account (free) with API key
- Supabase CLI installed locally
- Your BioFit repository cloned

---

## 🔑 Step 1: Get Your Groq API Key

1. Go to **[console.groq.com](https://console.groq.com)**
2. Click **Sign Up** (free account, no credit card needed)
3. Create account and verify email
4. Navigate to **API Keys** in the left sidebar
5. Click **"Create API Key"**
6. Copy your API key (starts with `gsk_`)
7. **Save it somewhere safe** - you'll need it for the next step

---

## 🔐 Step 2: Set Supabase Secret

Store your Groq API key in Supabase securely:

```bash
# Navigate to your project directory
cd mybiofit

# Set the secret (replace YOUR_KEY with your actual Groq API key)
supabase secrets set GROQ_API_KEY "gsk_your_actual_key_here"

# Verify it was set
supabase secrets list
```

**Important:** 
- Never commit API keys to GitHub
- The secret is only stored in Supabase, not in your code
- You can rotate the key anytime by setting it again

---

## 🚀 Step 3: Deploy the Groq Function

```bash
# Deploy the new Groq function
supabase functions deploy biofit-chat-groq

# Verify deployment
supabase functions list
```

You should see `biofit-chat-groq` in the list.

---

## 🔄 Step 4: Update Your App Code

Now update your app to use Groq instead of Gemini. Change the endpoint from `biofit-chat` to `biofit-chat-groq`:

### File 1: `src/hooks/useAIChat.ts`
Find this line:
```typescript
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat`;
```
Change to:
```typescript
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`;
```

### File 2: `src/pages/ScanMeal.tsx`
Find:
```typescript
const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat`, {
```
Change to:
```typescript
const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`, {
```

### File 3: `src/pages/GroceryList.tsx`
Find:
```typescript
const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat`, {
```
Change to:
```typescript
const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`, {
```

### File 4: `src/components/VoiceCallMode.tsx`
Find:
```typescript
const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat`, {
```
Change to:
```typescript
const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`, {
```

---

## 🧪 Step 5: Test It Out

1. **Local testing:**
   ```bash
   npm run dev
   # Test the meal scan feature
   # Test the AI chat
   # Test the grocery list AI suggestions
   ```

2. **Test in production:**
   - Deploy your changes
   - Use the app and verify AI responses work
   - Check Groq console for API usage stats

---

## 📊 Monitoring Your Usage

### Check Your Groq Stats:
1. Go to [console.groq.com](https://console.groq.com)
2. Click **"Usage"** tab
3. See your daily/monthly requests
4. Monitor your free tier limits

**Free Tier Limits:**
- 30-60 requests/minute
- Approximately 14,400+ requests/day
- Perfect for testing and small apps
- Scales with paid plans

---

## 🔄 Scaling When You Hit Limits

### Option 1: Upgrade to Groq Pro (Recommended)
```
$5-50/month depending on usage
Unlimited requests with pay-per-token pricing
Best for growing apps
```

### Option 2: Load Balancing (Multiple Providers)
```
- Groq primary (free tier)
- Cerebras backup
- Together AI fallback
Automatically switches if one hits rate limit
```

### Option 3: Self-Hosted (Complete Control)
```
Deploy Ollama or vLLM on your own server
Completely free inference
Best for millions of users
~$500-1000/month infrastructure cost
```

---

## 🐛 Troubleshooting

### Error: "GROQ_API_KEY is not configured"
```bash
# Check if secret is set
supabase secrets list

# If not set, set it again
supabase secrets set GROQ_API_KEY "your_key_here"

# Re-deploy the function
supabase functions deploy biofit-chat-groq
```

### Error: "Rate limited by Groq"
- You've hit the free tier limits (30-60 RPM)
- Solution: Implement exponential backoff or upgrade plan

### Function not responding
```bash
# Check the function logs
supabase functions logs biofit-chat-groq

# Re-deploy
supabase functions deploy biofit-chat-groq
```

---

## 📚 API Models Available

Groq offers several fast models:

| Model | Speed | Best For |
|-------|-------|----------|
| llama-3.1-70b-versatile | ⚡⚡ Ultra Fast | General chat, analysis |
| llama-3.1-8b-instant | ⚡⚡⚡ Fastest | Quick responses, low latency |
| mixtral-8x7b-32768 | ⚡ Fast | Complex tasks |

Current setup uses **llama-3.1-70b-versatile** (best balance of speed and quality).

---

## 🎯 Next Steps

1. ✅ Complete steps 1-5 above
2. 📊 Monitor usage in Groq console
3. 🚀 Deploy to production
4. 📈 Scale as your user base grows
5. 💡 Consider self-hosting if you hit millions of users/day

---

## 📞 Support

- **Groq Docs:** https://console.groq.com/docs
- **Groq Status:** https://status.groq.com
- **BioFit Issues:** File an issue in this repo

---

**You're all set! Your BioFit app is now powered by Groq. 🎉**
