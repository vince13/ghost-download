# Ghost Protocol Landing Page

Next.js landing page for Ghost Protocol - Real-Time AI Negotiation Wingman.

## Features

- **Hero Section** - Clear value proposition with CTAs
- **Demo Video Section** - Placeholder for "Inception Method" video
- **Features Section** - Key product benefits
- **Use Cases** - Sales, interviews, negotiations
- **Pricing Section** - All 4 tiers with clear CTAs
- **CTA Section** - Final conversion push
- **Responsive Design** - Mobile-first, works on all devices
- **Dark Theme** - Matches main app design system

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Option 1: Deploy as Separate Vercel Project (Recommended)

1. Push the `landing` directory to a separate GitHub repo (or subdirectory)
2. Import to Vercel as a new project
3. Deploy automatically on push

### Option 2: Deploy as Subdirectory

Update `vercel.json` in root to handle both apps:

```json
{
  "builds": [
    {
      "src": "landing/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/landing/(.*)", "dest": "/landing/$1" },
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

## Customization

### Update App URL

Replace `https://ghost-green.vercel.app` with your actual app URL in:
- `app/page.tsx` (all CTA links)
- Navigation links

### Add Demo Video

Replace the placeholder in the demo section with your actual video:

```tsx
<iframe
  className="w-full h-full rounded-xl"
  src="YOUR_VIDEO_URL"
  title="Ghost Demo"
  allowFullScreen
/>
```

### Update Contact Email

Replace `sales@ghostprotocol.ai` and `support@ghostprotocol.ai` with your actual emails.

## Next Steps

1. **Record Demo Video** - The "Inception Method" from `100customers.md`
2. **Add Testimonials** - Once you have early users
3. **Add FAQ Section** - Common questions
4. **Add Blog/Resources** - Content marketing
5. **A/B Test CTAs** - Optimize conversion
