# 🛠️ Forensic Pro Suite Setup Guide

This guide will walk you through setting up the project from scratch, including Supabase configuration and running both the frontend and backend.

## 1. 🗄️ Supabase Setup (From Scratch)

1. 📝 **Create an Account**: Go to [Supabase](https://supabase.com/) and sign in.
2. 🆕 **New Project**: Create a new project. Give it a name (e.g., `forensic-suite`) and set a secure database password.
3. 📊 **SQL Editor**: Once the project is ready, click on **SQL Editor** in the left sidebar.
4. 📋 **Create Table**: Click **New query** and paste the following SQL to create the `cases` table:

   ```sql
   create table cases (
     id uuid default gen_random_uuid() primary key,
     case_id text,
     filename text,
     hash_value text,
     investigator text,
     status text,
     created_at timestamp with time zone default now()
   );
   ```

5. 🔒 **Enable RLS**:
   - Go to **Table Editor** -> `cases`.
   - Click **RLS disabled** (or "Enable RLS") to enable Row Level Security.
6. 📜 **Add Policy**:
   - Click **Add Policy**.
   - Choose **"Enable read access for all users"** (or similar) or create a custom policy:
     - **Name**: `Allow public access`
     - **Allowed operations**: `SELECT`, `INSERT`
     - **Target roles**: `anon`
     - **Check expression**: `true`
   - This is necessary so the dashboard can read/write data using the anonymous key.
7. 🔑 **Get API Keys**:
   - Go to **Project Settings** -> **API**.
   - Copy the **Project URL** and the **anon public key**. You will need these for your environment variables.

---

## 2. 🎨 Frontend Configuration (`client`)

1. 💻 Open your terminal and navigate to the `client` folder:

   ```bash
   cd client
   ```

2. 📄 Create your local environment file:

   ```bash
   cp .env.local.example .env.local
   ```

3. ✏️ Open `.env.local` and fill in your Supabase details:
   - `NEXT_PUBLIC_SUPABASE_URL`: Paste your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Paste your Supabase anon key.
   - `NEXTAUTH_SECRET`: You can generate one by running `openssl rand -base64 32` or just typing a long random string.

4. 📦 Install dependencies and start:

   ```bash
   npm install --legacy-peer-deps
   npm run dev
   ```

   The frontend will be at `http://localhost:3000`.

---

## 3. ⚙️ Backend Configuration (`Server`)

1. 💻 Open another terminal and navigate to the `Server` folder:

   ```bash
   cd Server
   ```

2. 📄 Create the environment file:

   ```bash
   cp .env.example .env
   ```

3. ✏️ Open `.env` and fill in the same Supabase details:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_ANON_KEY`: Your Supabase anon key.

4. 🐍 Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. 🚀 Start the FastAPI server:

   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The backend will be at `http://localhost:8000`.

---

## 🔑 Login Credentials

Use the default credentials to log in to the dashboard:

- 📧 **Email**: `admin@forensics.com`
- 🔒 **Password**: `password123`

(These can be changed in your `client/.env.local` file)

---

## 🚀 Deployment Guide

### 1. ⚙️ Backend (Render)

1. 📝 Sign in to [Render](https://render.com).
2. ➕ Click **New +** -> **Web Service**.
3. 🔗 Connect your GitHub repository.
4. 📁 **Root Directory**: `Server`
5. 🐍 **Runtime**: `Python 3`
6. 🔨 **Build Command**: `pip install -r requirements.txt`
7. ▶️ **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
8. 🔑 **Environment Variables**:
   - `SUPABASE_URL`: Your Supabase URL.
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `ALLOWED_ORIGIN`: Your **Vercel URL** (e.g., `https://your-app.vercel.app`).

### 2. 🎨 Frontend (Vercel)

1. 📝 Sign in to [Vercel](https://vercel.com).
2. ➕ Click **Add New** -> **Project**.
3. 🔗 Connect your GitHub repository.
4. 📁 **Root Directory**: `client`
5. ⚡ **Framework Preset**: `Next.js`
6. 🔨 **Build Command**: `npm run build`
7. 📂 **Output Directory**: `.next` (Vercel detects this automatically)
8. 🔑 **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `NEXT_PUBLIC_API_URL`: Your **Render URL** (e.g., `https://forensic-pro-backend.onrender.com`).
   - `NEXTAUTH_URL`: Your **Vercel URL**.
   - `NEXTAUTH_SECRET`: A random string (generate with `openssl rand -base64 32`).
   - `ADMIN_EMAIL`: `admin@forensics.com`
   - `ADMIN_PASSWORD`: `password123`
