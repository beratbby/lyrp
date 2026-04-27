# lyrp.io Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL (running locally or via cloud)

## 1. Install dependencies
```bash
npm run install:all
```

## 2. Configure environment
Edit `server/.env`:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — any long random string
- `FASTERSMM_API_KEY` — your FasterSMM API key
- `SMM_SERVICE_IG_FOLLOWERS` — service ID from FasterSMM for Instagram Followers
- `SMM_SERVICE_TT_LIKES` — service ID from FasterSMM for TikTok Likes
- `SMM_SERVICE_TT_VIEWS` — service ID from FasterSMM for TikTok Views

**Finding FasterSMM service IDs:** Log into fastersmm.com → Services → find the service → note the ID number.

## 3. Initialize database
Connect to PostgreSQL and run:
```bash
psql -U postgres -d lyrpio -f server/db/schema.sql
```
Or create the DB first: `createdb lyrpio`

## 4. Run in development
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 5. Update featured account
To change the daily featured account (your revenue slot), run in PostgreSQL:
```sql
UPDATE featured_account SET username = 'new_account', url = 'https://instagram.com/new_account', platform = 'instagram';
```

## Revenue model
Charge creators $5–20/day to be the featured account. Every user must follow/engage with the featured account daily to unlock their claims.
