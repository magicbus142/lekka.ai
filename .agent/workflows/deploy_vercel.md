---
description: Deploy the application to Vercel
---

# Deploy to Vercel

This workflow guides you through deploying the **ShopSync** application to Vercel.

## Prerequisites
- [ ] Vercel Account (Sign up at vercel.com)
- [ ] Vercel CLI installed (optional, but recommended)

## Steps

### 1. Build Verification
First, verify that the application builds locally without errors.
// turbo
```bash
npm run build
```

### 2. Login to Vercel
If you strictly want to use the CLI, login first.
```bash
npx vercel login
```

### 3. Deploy
Run the deploy command. configuring the project when prompted.
- **Scope**: Select your personal account or team.
- **Link to existing project**: [N] (unless you already created one)
- **Project Name**: `shopsync` (or your preferred name)
- **Directory**: `./`
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Development Command**: `next dev` (default)

```bash
npx vercel
```

### 4. Environment Variables
**IMPORTANT**: You must add your Supabase environment variables to Vercel Project Settings > Environment Variables.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Production Deploy
Once verification is done, deploy to production.
```bash
npx vercel --prod
```
