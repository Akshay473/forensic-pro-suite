# 🛡️ Sentinel-Forensics: AI-Augmented Digital Investigation Suite

A full-stack Digital Forensics Workstation for automated artifact extraction, geospatial threat triage, and chain-of-custody documentation.

## 🚀 Key Features

* **Secure Investigator Portal:** NextAuth.js credential-based login with session management.
* **Automated Triage Pipeline:** FastAPI backend performs SHA-256 integrity hashing and file metadata extraction via a `ForensicEngine` class.
* **Persistent Evidence Vault:** Case records stored in Supabase (PostgreSQL) with RLS, linked to the authenticated investigator's email.
* **Geospatial Threat Attribution:** Interactive zoomable world map (React-Simple-Maps + D3-Geo) plotting 6 simulated threat nodes with severity-coded markers.
* **Forensic Tool Dashboard:** Cards for EnCase, Wireshark, Autopsy, FTK Imager, and Data Recovery — plus the live **Automated Flow** trigger.
* **Analysis Logs:** Real-time animated log stream displayed during file processing.
* **Interactive Forensic Assistant:** Framer Motion robot widget with a 6-step guided tutorial (progress persisted via `localStorage`).
* **Xterm.js Terminal:** Embedded browser-based CLI for manual triage commands.
* **PDF Report Generation:** Client-side chain-of-custody reports via jsPDF + jspdf-autotable, exported per case record.
* **Case Volume Chart:** Recharts bar chart showing case activity over the last 7 days, live in the dashboard.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Auth | NextAuth.js v4 (Credentials Provider) |
| Animations | Framer Motion |
| Maps | React-Simple-Maps, D3-Geo, TopoJSON |
| Charts | Recharts |
| Terminal | Xterm.js + xterm-addon-fit |
| PDF | jsPDF, jspdf-autotable |
| Backend | FastAPI (Python), Uvicorn, python-multipart |
| Database | Supabase (PostgreSQL + RLS) |
| Icons | Lucide React |

## 📁 Project Structure

```
forensic-pro-suite/
├── client/                  # Next.js frontend
│   ├── app/
│   │   ├── login/           # Investigator login page
│   │   ├── dashboard/       # Main workstation UI
│   │   └── api/auth/        # NextAuth.js route handler
│   ├── components/
│   │   ├── ForensicMap.tsx      # Geospatial threat map
│   │   ├── RobotAssistant.tsx   # Guided tutorial widget
│   │   ├── Terminal.tsx         # Xterm.js CLI
│   │   ├── AnalysisLogs.tsx     # Live log stream
│   │   └── TutorialOverlay.tsx  # Step-aware highlight overlay
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── reportGenerator.ts   # jsPDF chain-of-custody export
│   └── middleware.ts            # Edge route protection for /dashboard
└── Server/                  # FastAPI backend
    ├── main.py              # /api/analyze endpoint (with file type validation)
    ├── engine.py            # ForensicEngine class (hash + metadata)
    └── requirements.txt
```

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* Python 3.9+
* A [Supabase](https://supabase.com) project

### 1. Supabase Setup

Create a `cases` table in your Supabase project with the following schema:

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

Enable Row Level Security (RLS) on the table as needed.

> If RLS is enabled, make sure to add a policy that allows your anon key to insert and select rows, or the dashboard will show a connection error.

### 2. Environment Variables

```bash
cd client
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXTAUTH_SECRET=        # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@forensics.com
ADMIN_PASSWORD=your_password_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Backend

```bash
cd Server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd client
npm install
npm run dev
```

The app runs on `http://localhost:3000`. The FastAPI backend must be running before using the Automated Flow — if it's unreachable the dashboard falls back to an offline demo result.

> The backend only accepts forensic file types (`.dd`, `.e01`, `.pcap`, `.log`, `.pdf`, etc.). Executables and scripts are rejected with a 400 error.

### 🔑 Demo Login

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` to your chosen credentials. The defaults in `.env.local.example` are:

```
Email:    admin@forensics.com
Password: password123
```

> The `/dashboard` route is protected by Next.js middleware — unauthenticated users are automatically redirected to `/login`.

## 🔬 Forensic Methodology (NIST SP 800-86)

1. **Identification:** SHA-256 hashing via the Automated Flow card.
2. **Preservation:** Original file is read-only; a forensic copy is processed in memory.
3. **Collection:** File metadata (size, timestamps) extracted by `ForensicEngine`.
4. **Examination:** Case records persisted to Supabase with investigator attribution.
5. **Analysis:** Threat nodes visualized on the geospatial map.
6. **Reporting:** Per-case PDF chain-of-custody report generated client-side.
