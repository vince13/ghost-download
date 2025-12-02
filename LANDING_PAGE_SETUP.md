# Landing Page Setup Guide

## ✅ What's Been Created

A complete Next.js landing page with:

1. **Hero Section** - "Never freeze in a negotiation again" with CTAs
2. **Demo Video Section** - Placeholder for your "Inception Method" video
3. **Features Section** - 6 key benefits (latency, undetectable, RAG, playbooks, replay, cross-platform)
4. **Use Cases** - Sales, Interviews, Negotiations with specific benefits
5. **Pricing Section** - All 4 tiers (Free, Starter, Founders, Enterprise)
6. **CTA Section** - Final conversion push
7. **Footer** - Links and contact info

## 🚀 Quick Start

### Local Development

```bash
cd landing
npm run dev
```

Visit `http://localhost:3000`

### Deploy to Vercel

**Option 1: Separate Project (Recommended)**
1. Push `landing` folder to GitHub (or keep in same repo)
2. Go to Vercel dashboard
3. Import project → Select `landing` directory
4. Deploy

**Option 2: Same Project**
- Update root `vercel.json` to handle both apps (see README.md)

## 📝 Customization Checklist

- [ ] Update app URL: Replace `https://ghost-green.vercel.app` with your actual URL
- [ ] Add demo video: Replace placeholder in demo section
- [ ] Update contact emails: `sales@ghostprotocol.ai` and `support@ghostprotocol.ai`
- [ ] Add testimonials section (after you get users)
- [ ] Add FAQ section
- [ ] Add analytics (Google Analytics, Plausible, etc.)

## 🎥 Demo Video Setup

The "Inception Method" video should show:
1. You negotiating a bill (Comcast, internet, software subscription)
2. Ghost running on screen showing coaching cues
3. You following the advice and winning the discount
4. Final result: "Saved $400"

**Where to host:**
- YouTube (unlisted)
- Vimeo
- Loom
- Or embed directly

**Video embed code:**
```tsx
<iframe
  className="w-full h-full rounded-xl"
  src="YOUR_VIDEO_URL"
  title="Ghost Demo - Saved $400 on Comcast Bill"
  allowFullScreen
/>
```

## 🔗 Links to Update

All links currently point to `https://ghost-green.vercel.app`. Update these in `app/page.tsx`:

- Navigation "Launch App" button
- Hero "Start Free Trial" button
- Hero "Watch Demo" button (scrolls to demo section)
- Pricing "Get Started" buttons
- Pricing "Upgrade" buttons
- Pricing "Join Founders Club" button
- CTA "Start Free Trial" button
- Footer "App" link

## 📊 Analytics Setup

Add to `app/layout.tsx`:

```tsx
// Google Analytics
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  `}
</Script>
```

## ✨ Next Steps

1. **Record the demo video** (highest priority)
2. **Deploy to production**
3. **Test all links** work correctly
4. **Add analytics** to track conversions
5. **A/B test** different CTAs
6. **Add testimonials** as you get users

## 🎯 Conversion Optimization

- **Hero CTA**: "Start Free Trial" (primary) + "Watch Demo" (secondary)
- **Pricing**: Founders Club highlighted as "BEST VALUE"
- **Multiple CTAs**: Every section has a clear path to sign up
- **Social Proof**: Add testimonials when available
- **Urgency**: Consider adding "Limited time" or "Early bird" badges

---

**Time to launch:** ~1 hour (just add video and deploy)

