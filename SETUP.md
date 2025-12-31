# Cloud Sync Setup Guide

This guide will help you set up free cloud storage and sync for your Health App using Supabase.

## What is Supabase?

Supabase is a free, open-source Firebase alternative that provides:
- **Free tier**: 500MB database, 2GB bandwidth per month
- **PostgreSQL database**: Industry-standard SQL database
- **Built-in authentication**: Secure user management
- **Row-level security**: Your data is private and encrypted

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

## Step 2: Create a New Project

1. Click "New Project" in your Supabase dashboard
2. Fill in the project details:
   - **Name**: Health App (or any name you prefer)
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose the closest region to you
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be set up

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon/public key**: Copy this (a long string starting with `eyJ...`)

## Step 4: Create the Database Table

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click "New query"
3. Copy and paste this SQL code:

```sql
-- Create health_data table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS health_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  health_logs TEXT NOT NULL,
  app_settings TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own data" ON health_data;
DROP POLICY IF EXISTS "Users can insert own data" ON health_data;
DROP POLICY IF EXISTS "Users can update own data" ON health_data;
DROP POLICY IF EXISTS "Users can delete own data" ON health_data;

-- Create policies: Users can only access their own data
CREATE POLICY "Users can view own data" ON health_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON health_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON health_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON health_data
  FOR DELETE USING (auth.uid() = user_id);
```

4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned"

## Step 5: Configure the App

1. Open `cloud-sync.js` in your project
2. Find these two lines at the top:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Replace them with your actual credentials:
   ```javascript
   const SUPABASE_URL = 'https://xxxxx.supabase.co';  // Your Project URL
   const SUPABASE_ANON_KEY = 'eyJ...';  // Your anon/public key
   ```
4. Save the file

## Step 6: Test the Setup

1. Open your Health App in a browser
2. Click the settings icon (gear) in the top right
3. Scroll down to the "☁️ Cloud Sync" section
4. You should see "Not configured" change to "Not connected"
5. Enter an email and password
6. Click "📝 Sign Up" to create an account
7. Check your email and verify your account
8. Click "🔐 Sign In" to log in
9. Your data should now sync automatically!

## Features

### Automatic Sync
- Enable "Auto-sync on changes" to automatically sync your data whenever you add or modify entries
- Data syncs 2 seconds after your last change (debounced)

### Manual Sync
- Click "🔄 Sync Now" to manually sync your data to the cloud
- Data automatically syncs from cloud when you log in

### Security
- All data is encrypted before being sent to the cloud
- Your data is private - only you can access it (Row Level Security)
- Passwords are securely hashed by Supabase

### Conflict Resolution
- If the same entry exists locally and in the cloud, the cloud version takes precedence
- Local entries that don't exist in the cloud are merged automatically

## Troubleshooting

### "Not configured" message
- Make sure you've updated `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `cloud-sync.js`
- Check that you copied the correct values from Supabase dashboard

### "Error creating account"
- Make sure your password is at least 6 characters
- Check that you're using a valid email address
- Verify your email if Supabase sent a verification email

### "Error syncing to cloud"
- Make sure you've created the database table (Step 4)
- Check that Row Level Security policies are set up correctly
- Verify you're signed in (check the status indicator)

### Data not syncing
- Make sure "Auto-sync on changes" is enabled
- Try clicking "🔄 Sync Now" manually
- Check your internet connection
- Look at the browser console (F12) for error messages

## Free Tier Limits

Supabase free tier includes:
- **500MB database storage** - Enough for thousands of health entries
- **2GB bandwidth per month** - Plenty for regular syncing
- **Unlimited API requests** - No limits on sync operations

## Need Help?

- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
- Check browser console (F12) for detailed error messages

## Security Notes

- Your data is encrypted before being sent to Supabase
- Supabase uses industry-standard security practices
- Your password is never stored in plain text
- Row Level Security ensures only you can access your data
- The encryption key is derived from your user ID (not your password)

Enjoy secure, free cloud storage for your health data! 🎉
