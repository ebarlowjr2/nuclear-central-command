# Nuclear Market Panel - Setup Guide

This guide walks you through setting up the Nuclear Market panel feature that was just added to your Nuclear Command Center application.

## Overview

The Nuclear Market panel displays real-time stock quotes for nuclear-related investments organized into 4 categories:
- **ETFs**: Nuclear and uranium-focused exchange-traded funds
- **SMR/Advanced**: Small Modular Reactor and advanced nuclear companies
- **Fuel & Equipment**: Uranium mining and nuclear equipment suppliers
- **Utilities**: Power utilities with significant nuclear generation

## What You Need to Do Manually

### 1. Set Up Market Database Schema in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-market-schema.sql` from the repository
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to execute the SQL
6. Verify success - you should see 3 new tables created:
   - `securities` - Master list of stocks/ETFs
   - `security_quotes` - Latest price quotes
   - `security_prices_daily` - Historical daily prices (optional)

### 2. Get a Market Data API Key

You need **ONE** of the following API keys (choose based on your needs):

#### Option A: Finnhub (Recommended)
- **Best for**: Most users, good rate limits, reliable
- **Sign up**: https://finnhub.io/register
- **Free tier**: 60 API calls/minute
- **Environment variable**: `FINNHUB_API_KEY`

#### Option B: Alpha Vantage
- **Best for**: Free tier users (but heavily rate-limited)
- **Sign up**: https://www.eia.gov/opendata/register.php
- **Free tier**: 5 API calls/minute (very limited!)
- **Environment variable**: `ALPHAVANTAGE_API_KEY`

#### Option C: Polygon.io
- **Best for**: Premium users needing high rate limits
- **Sign up**: https://polygon.io/
- **Pricing**: Paid plans start at $29/month
- **Environment variable**: `POLYGON_API_KEY`

### 3. Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add your chosen market data API key:
   - **Key**: `FINNHUB_API_KEY` (or `ALPHAVANTAGE_API_KEY` or `POLYGON_API_KEY`)
   - **Value**: Your API key
   - **Environments**: Select all (Production, Preview, Development)

4. Add the seed enabler (temporary):
   - **Key**: `ALLOW_MARKET_SEED`
   - **Value**: `true`
   - **Environments**: Production only
   - **Note**: You'll remove this after seeding

### 4. Redeploy Your Application

1. In Vercel, go to **Deployments**
2. Click the **...** menu on the latest deployment
3. Select **Redeploy**
4. Wait for deployment to complete

### 5. Seed the Securities Database

1. Once deployed, visit: `https://your-app.vercel.app/api/market/seed`
2. You should see a success message with count of securities seeded (14 securities)
3. **Important**: Now remove the `ALLOW_MARKET_SEED` environment variable from Vercel
   - Go to Settings → Environment Variables
   - Delete `ALLOW_MARKET_SEED`
   - This prevents unauthorized access to the seed endpoint

### 6. Refresh Market Quotes (First Time)

1. Visit: `https://your-app.vercel.app/api/market/refresh`
2. This will fetch the latest quotes for all securities
3. You should see: `{"ok":true,"updated":14,"timestamp":"..."}`
4. If you see errors, check that your API key is valid and has remaining quota

### 7. Set Up Vercel Cron Job for Automatic Quote Updates

1. In Vercel, go to **Settings** → **Cron Jobs**
2. Click **Create Cron Job**
3. Configure:
   - **Path**: `/api/market/refresh`
   - **Schedule**: `*/30 * * * *` (every 30 minutes)
   - **Description**: Refresh nuclear market quotes
4. Click **Create**

**Alternative schedules** (if you want to optimize for market hours):
- Market hours only (9:30 AM - 4:00 PM ET): `*/15 13-20 * * 1-5`
- Once per hour: `0 * * * *`
- Every 15 minutes: `*/15 * * * *`

### 8. Verify Everything Works

1. Visit your home page: `https://your-app.vercel.app`
2. Scroll down to the **Nuclear Market** section
3. You should see:
   - 4 tabs: ETFs, SMR/Advanced, Fuel & Equipment, Utilities
   - Stock cards with symbols, names, prices, and % change
   - Disclaimer about delayed quotes and educational purposes
   - "High Volatility" badges on SMR/Advanced companies

## Troubleshooting

### No quotes showing (prices show as "—")

**Possible causes:**
1. Market data API key not configured or invalid
2. API rate limit exceeded
3. Quotes haven't been refreshed yet

**Solutions:**
1. Check environment variables in Vercel
2. Visit `/api/market/refresh` manually to trigger a refresh
3. Check Vercel logs for error messages

### "No instruments found in this category"

**Possible causes:**
1. Securities not seeded
2. Database connection issue

**Solutions:**
1. Visit `/api/market/seed` again (make sure `ALLOW_MARKET_SEED=true`)
2. Check Supabase connection in Vercel logs

### API rate limit errors

**Possible causes:**
1. Using Alpha Vantage (5 calls/minute limit)
2. Cron job running too frequently

**Solutions:**
1. Switch to Finnhub (60 calls/minute)
2. Reduce Cron frequency to every hour or every 30 minutes

### Securities not appearing after seed

**Possible causes:**
1. Supabase schema not created
2. Database permissions issue

**Solutions:**
1. Re-run `supabase-market-schema.sql` in Supabase SQL Editor
2. Check for error messages in the seed response

## What's Included

### Securities Seeded (14 total)

**ETFs (4):**
- URA - Global X Uranium ETF
- URNM - Sprott Uranium Miners ETF
- NLR - VanEck Uranium & Nuclear ETF
- NUKZ - Range Nuclear Renaissance ETF

**SMR/Advanced (2):**
- SMR - NuScale Power
- OKLO - Oklo Inc.

**Fuel & Equipment (4):**
- CCJ - Cameco
- BWXT - BWX Technologies
- UEC - Uranium Energy Corp
- DNN - Denison Mines

**Utilities (4):**
- EXC - Exelon
- DUK - Duke Energy
- SO - Southern Company
- CEG - Constellation Energy

## Adding More Securities

To add more securities to track:

1. Go to Supabase SQL Editor
2. Run an INSERT query:

```sql
INSERT INTO securities (symbol, name, category, exchange, country)
VALUES 
  ('UUUU', 'Energy Fuels', 'Fuel & Equipment', 'NYSE', 'US'),
  ('NXE', 'NexGen Energy', 'Fuel & Equipment', 'NYSE', 'CA');
```

3. Visit `/api/market/refresh` to fetch quotes for the new securities

## API Endpoints Reference

- `GET /api/market/list?category=ETF` - List securities by category
- `GET /api/market/search?q=uranium` - Search securities
- `GET /api/market/refresh` - Refresh all quotes (called by Cron)
- `GET /api/market/seed` - One-time seed (requires ALLOW_MARKET_SEED=true)

## Important Notes

1. **Quotes may be delayed** - Free tier APIs often provide delayed quotes (15-20 minutes)
2. **Not investment advice** - This feature is for educational purposes only
3. **Rate limits** - Be mindful of your API provider's rate limits
4. **Market hours** - Stock quotes only update during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
5. **Holidays** - Markets are closed on US holidays

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Verify all environment variables are set correctly
4. Test API endpoints manually by visiting them in your browser

---

**Repository**: https://github.com/ebarlowjr2/nuclear-central-command
**Branch**: devin/1762048125-nuclear-command-center-app
**Commit**: da5ba98
