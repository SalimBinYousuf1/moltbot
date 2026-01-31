# Deploy Web AI Assistant to Vercel

## Quick Summary

Your web-based AI assistant is **ready to deploy to Vercel in 3 simple steps** directly from v0!

---

## Step 1: Click "Publish" in v0 (Top Right)

1. Look for the **"Publish"** button in the top-right corner of v0
2. Click it to start the deployment process
3. v0 will automatically push your code to Vercel

---

## Step 2: Connect Your Vercel Account

If you haven't connected Vercel yet:
- v0 will prompt you to connect your Vercel account
- Click "Connect to Vercel"
- Authenticate with your Vercel credentials
- Authorize v0 to deploy on your behalf

---

## Step 3: Add Environment Variables

After deployment starts, you **MUST** add API keys in Vercel:

### Required Environment Variable:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

**How to add it:**
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your deployed project
3. Click "Settings" → "Environment Variables"
4. Add new variable: `OPENAI_API_KEY` with your OpenAI API key
5. Redeploy (Vercel will auto-redeploy)

### Optional Environment Variables:
```
BRAVE_API_KEY=your-brave-search-api-key
```

---

## Complete Deployment Flow

### From v0 (Simplest):
```
1. Click "Publish" button (top right)
2. Authorize Vercel connection
3. Wait for deployment to complete
4. Go to Settings → Environment Variables
5. Add OPENAI_API_KEY
6. Redeploy (auto-trigger or manual)
```

### From GitHub (Alternative):
```
1. Click Settings in v0 sidebar
2. Connect to GitHub
3. Push to your GitHub repository
4. Go to Vercel dashboard
5. Import from GitHub
6. Add environment variables
7. Deploy
```

---

## Verify Deployment Works

Once deployed:

1. **Visit your live URL** (Vercel gives you a URL like `https://yourapp-*.vercel.app`)
2. **Test the chat**: Try asking "What is 2+2?" or "Tell me about AI"
3. **Check console**: Open browser DevTools → Console for debugging
4. **Monitor errors**: Check Vercel dashboard → Functions for logs

---

## Environment Variable Details

### OPENAI_API_KEY (Required)
- **Where to get it**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Cost**: Pay-as-you-go (typically $0.01-$0.10 per chat)
- **Format**: `sk-...` (long string)
- **Add in Vercel Settings**: Environment Variables section

### BRAVE_API_KEY (Optional)
- **For**: Enhanced web search results
- **Where to get it**: [https://api.search.brave.com](https://api.search.brave.com)
- **If missing**: Falls back to DuckDuckGo API (still works!)

---

## Troubleshooting Deployment

### "Build Failed" Error
**Solution**: Check that all dependencies are installed
```bash
npm install ai zod lucide-react
```

### "OPENAI_API_KEY is undefined"
**Solution**: Add it in Vercel Settings → Environment Variables, then redeploy

### API calls return 403/401
**Solution**: Check your API key is valid and has active credits

### Chat not responding
**Solution**: 
1. Check Vercel function logs (Settings → Logs)
2. Verify API key is set
3. Check browser console for errors

---

## Advanced Configuration

### Custom Domain
1. In Vercel dashboard: Project Settings → Domains
2. Add your custom domain (e.g., `ai.yoursite.com`)
3. Configure DNS records

### Production Optimization
1. Enable "Edge Functions" in Vercel Settings
2. Set up monitoring with Vercel Analytics
3. Configure rate limiting for API routes

### Regional Deployment
1. Vercel Settings → General → Function Region
2. Choose closest region to your users
3. Or use serverless functions globally

---

## Cost Estimation

- **Vercel hosting**: Free for most projects
- **OpenAI API**: $0.01-$0.50 per chat (depends on model)
- **Bandwidth**: Included in Vercel free tier

---

## Next Steps After Deployment

1. **Share your URL** with others
2. **Monitor usage** in Vercel dashboard
3. **Add custom branding** (modify colors in `/app/globals.css`)
4. **Enable authentication** (optional - add Auth0/NextAuth)
5. **Add database** (optional - for chat history)

---

## Quick Links

- **v0 Settings**: Look for the settings icon in the left sidebar
- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **OpenAI API Keys**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Vercel Environment Variables Guide**: [https://vercel.com/docs/projects/environment-variables](https://vercel.com/docs/projects/environment-variables)

---

## Support

- **v0 Issues**: Click "Help" in v0 or visit [https://vercel.com/help](https://vercel.com/help)
- **Vercel Issues**: Check [https://vercel.com/docs](https://vercel.com/docs)
- **OpenAI Issues**: Visit [https://platform.openai.com/docs](https://platform.openai.com/docs)

---

## That's It!

Your AI assistant will be live on the internet in ~5 minutes. The deployment is automatic - Vercel handles all server setup, SSL certificates, and scaling. You just need to add your API key and you're done!

**Questions about the tools or features?** Check `README_WEBAI.md` or `USAGE_EXAMPLES.md`
