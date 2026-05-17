# 📖 Project Instructions & File Guide

Welcome to the **Forensic Pro Suite**! This document provides a comprehensive overview of the project structure and the working principles of each key file.

## 📁 Root Directory

- 📘 **`README.md`**: The main landing page for the repository, containing high-level features, methodology, and getting started guides.
- 🛠️ **`SETUP.md`**: Detailed step-by-step instructions for environment configuration, database setup, and deployment.
- 🤝 **`CONTRIBUTING.md`**: Guidelines for developers who wish to contribute to the project.
- 🔒 **`SECURITY.md`**: Outlines the security policy and vulnerability reporting process.
- 📜 **`LICENSE.md`**: Defines the legal usage terms for the software.

## 🎨 Client (Frontend - Next.js)

The `client/` directory contains the React-based investigator workstation.

### 📂 `app/` (Next.js App Router)

- 🏗️ **`layout.tsx`**: The root layout that defines the consistent UI structure (fonts, metadata) and wraps the app with providers.
- 🔌 **`providers.tsx`**: Manages global state providers like NextAuth.js for session handling.
- 🚪 **`page.tsx`**: The entry point of the application, usually handling redirects.
- 🔐 **`login/page.tsx`**: The investigator authentication page.
- 🖥️ **`dashboard/page.tsx`**: The primary workstation interface, coordinating tools, maps, and database records.

### 🧩 `components/` (UI Elements)

- 💻 **`Terminal.tsx`**: A high-fidelity Xterm.js simulation of forensic CLI tools.
- 🗺️ **`ForensicMap.tsx`**: Interactive geospatial threat map for visualizing investigation nodes.
- 📋 **`AnalysisLogs.tsx`**: Real-time log stream showing automated pipeline events.
- 🤖 **`RobotAssistant.tsx`**: An interactive AI-driven guide to help investigators navigate the suite.
- 🪟 **`ToolModal.tsx`**: Dynamic modal window for detailed tool information and task management.
- 📡 **`ThreatIntelligenceFeed.tsx`**: Simulated live feed of global forensic events.
- ⏳ **`Preloader.tsx`**: The branded loading screen displayed during initial boot.

### 📦 `lib/` (Utility Logic)

- 📄 **`reportGenerator.ts`**: Core logic for generating comprehensive jsPDF chain-of-custody reports.
- 🗄️ **`supabase.ts`**: Configuration and initialization of the Supabase client for evidence persistence.
- 📊 **`csvExport.ts`**: Handles the conversion and download of case records into CSV format.
- 📦 **`evidenceBundle.ts`**: Logic for packaging investigation data into exportable bundles.

## ⚙️ Server (Backend - FastAPI)

The `Server/` directory handles the automated forensic processing logic.

- 🚪 **`main.py`**: The API entry point. Handles file uploads, validation, and CORS policies.
- 🧠 **`engine.py`**: The "Brain" of the suite. Contains the `ForensicEngine` class which performs hashing (SHA-256/MD5) and metadata extraction.
- 📋 **`requirements.txt`**: Lists the Python dependencies required for the backend processing.

## 🔧 Working Principles

1. 🔐 **Authentication**: Users authenticate via `login/page.tsx` using NextAuth.js.
2. 📥 **Evidence Ingestion**: Files are uploaded through the `Dashboard` and processed by the FastAPI `Server`.
3. 🔬 **Analysis**: The `ForensicEngine` extracts metadata and generates integrity hashes.
4. 🗄️ **Persistence**: Results are stored in **Supabase** via `supabase.ts`.
5. 🗺️ **Visualization**: Data is visualized using the `ForensicMap` and `Recharts` in the dashboard.
6. 📄 **Reporting**: Final findings are exported as professional PDFs using `reportGenerator.ts`.

---

*For further technical details, please refer to the inline comments within the source files.* 💡
