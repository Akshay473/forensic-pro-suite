# 🕵️ Forensic Pro Suite: AI-Augmented Digital Investigation Suite

A high-fidelity Digital Forensics Workstation enhanced for automated artifact extraction, geospatial threat triage, and redundant chain-of-custody documentation.

| Resource               | Link                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| 🚀 **Live Workstation** | [https://forensic-pro-suite-new.vercel.app/](https://forensic-pro-suite-new.vercel.app/)         |

## 🛡️ Advanced Forensic Enhancements (The "Strong" Version)

This version has been overhauled to provide military-grade forensic reliability:

- 🔐 **Dual-Hash Integrity Pipeline:** Implemented simultaneous SHA-256 and MD5 hashing for every artifact to ensure zero-collision data integrity.
- 🔍 **Magic Number (File Signature) Analysis:** Added deep header inspection to detect extension spoofing and hidden executables disguised as documents.
- 📡 **Live Threat Intelligence Feed:** Integrated a real-time (simulated) global threat monitoring dashboard for constant situational awareness.
- 🧠 **Heuristic Threat Assessment:** Automated classification of evidence risk levels (Neutral vs. Elevated) based on signature verification.
- 📋 **Advanced Metadata Extraction:** Expanded the Python `ForensicEngine` to capture OS-level artifacts like file permissions and last-accessed timestamps.
- 🤖 **Upgraded Forensic Assistant:** Re-trained the interactive AI guide to support advanced triage methodology.

---

## 🧭 Navigation

- 📖 [Full Setup Guide](./SETUP.md)
- 🚀 [Deployment Guide](./SETUP.md#deployment-guide)
- 📂 [File Guide & Instructions](./INSTRUCTIONS.md)
- 🔒 [Security Policy](./SECURITY.md)
- 🤝 [Contributing](./Contributing.md)
- 📜 [License](./LICENSE.md)

---

## ✨ Key Features

- 🔐 **Secure Investigator Portal:** NextAuth.js credential-based login with session management.
- ⚡ **Automated Triage Pipeline:** FastAPI backend performs SHA-256 + MD5 integrity hashing and deep metadata extraction.
- 🗄️ **Persistent Evidence Vault:** Case records stored in Supabase (PostgreSQL) with RLS, linked to the investigator.
- 🌍 **Geospatial Threat Attribution:** Interactive world map plotting 6 simulated threat nodes with severity-coded markers.
- 🧰 **Forensic Tool Dashboard:** Cards for EnCase, Wireshark, Autopsy, and the **Automated Flow** trigger.
- 📡 **Live Threat Feed:** Real-time log stream of global forensic events.
- 💻 **Investigator CLI (Xterm.js):** A high-fidelity terminal simulation of industry-standard forensic tools (`Autopsy`, `Volatility`, `Wireshark`) for manual triage.
- 📄 **PDF Report Generation:** Enhanced chain-of-custody reports via jsPDF including advanced metrics.

---

## 💻 Investigator CLI Commands

The embedded terminal (`investigator_cli_v1`) allows you to simulate high-level forensic triage. Type `help` in the dashboard terminal to see these in action:

| Command            | Forensic Function      | Simulation Output                                                        |
| ------------------ | ---------------------- | ------------------------------------------------------------------------ |
| `autopsy`          | 🔬 Sleuth Kit Engine   | Partition table analysis and deleted file detection.                     |
| `wireshark --cli`  | 🌐 Network Triage      | Live packet capture simulation with DNS threat detection.                |
| `vol.py --info`    | 🧠 Memory Forensics    | Volatility 3 framework output showing suspicious processes.              |
| `fls <image>`      | 📁 File Listing        | Inode and file system record extraction from a disk image.               |
| `mactime`          | ⏱️ Timeline Analysis   | Temporal evidence visualization (Modified/Accessed/Created).             |
| `clear`            | 🧹 UI Management       | Flushes the terminal buffer.                                             |

---

## 🛠️ Tech Stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| 🎨 Frontend  | Next.js 16, React 19, TypeScript, Tailwind CSS v4     |
| 🔐 Auth      | NextAuth.js v4 (Credentials Provider)                 |
| 🎬 Animations| Framer Motion                                         |
| 🗺️ Maps      | React-Simple-Maps, D3-Geo, TopoJSON                   |
| 📊 Charts    | Recharts                                              |
| 💻 Terminal  | Xterm.js + xterm-addon-fit                            |
| 📄 PDF       | jsPDF, jspdf-autotable                                |
| ⚙️ Backend   | FastAPI (Python), Uvicorn, python-multipart           |
| 🗄️ Database  | Supabase (PostgreSQL + RLS)                           |
| 🎨 Icons     | Lucide React                                          |

## 📁 Project Structure

> For a detailed breakdown of each file and its working principle, see **[INSTRUCTIONS.md](./INSTRUCTIONS.md)**.

```text
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

### 📋 Prerequisites

- 🟢 Node.js 18+
- 🐍 Python 3.9+
- 🗄️ A [Supabase](https://supabase.com) project

### 1. 🗄️ Supabase Setup

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

> ⚠️ If RLS is enabled, make sure to add a policy that allows your anon key to insert and select rows, or the dashboard will show a connection error.

### 2. 🔑 Environment Variables

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

### 3. ⚙️ Backend

```bash
cd Server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. 🎨 Frontend

```bash
cd client
npm install --legacy-peer-deps
npm run dev
```

The app runs on `http://localhost:3000`. The FastAPI backend must be running before using the Automated Flow -- if it's unreachable the dashboard falls back to an offline demo result.

> ⚠️ The backend only accepts forensic file types (`.dd`, `.e01`, `.pcap`, `.log`, `.pdf`, etc.). Executables and scripts are rejected with a 400 error.

### 🔑 Demo Login

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` to your chosen credentials. The defaults in `.env.local.example` are:

```text
Email:    admin@forensics.com
Password: password123
```

> 🔒 The `/dashboard` route is protected by Next.js middleware -- unauthenticated users are automatically redirected to `/login`.

## 📐 Forensic Methodology (NIST SP 800-86)

1. 🔍 **Identification:** SHA-256 hashing via the Automated Flow card.
2. 🛡️ **Preservation:** Original file is read-only; a forensic copy is processed in memory.
3. 📦 **Collection:** File metadata (size, timestamps) extracted by `ForensicEngine`.
4. 🗄️ **Examination:** Case records persisted to Supabase with investigator attribution.
5. 🌍 **Analysis:** Threat nodes visualized on the geospatial map.
6. 📄 **Reporting:** Per-case PDF chain-of-custody report generated client-side.
