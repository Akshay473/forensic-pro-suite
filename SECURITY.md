# 🔒 Security Policy

## 📦 Supported Versions

We are committed to maintaining the security of the **Forensic Pro Suite**. The following versions are currently receiving security updates:

| Version  | Supported          |
| -------- | ------------------ |
| v1.x     | ✅ Yes             |
| < v1.x   | ❌ No              |

## 🐛 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a potential security vulnerability within this project, please report it privately to the maintainers. We take all security reports seriously and will work to address them as quickly as possible.

### 📧 How to Report

Please send an email to **<security@forensics-suite.com>** with the following information:

1. 📋 **Type of issue** (e.g., SQL injection, XSS, RCE, Data Leak).
2. 📍 **Location** of the vulnerability (URL, file path, or component).
3. 📝 **Detailed steps to reproduce** the issue (Proof of Concept).
4. ⚠️ **Potential impact** of the vulnerability.
5. 💡 (Optional) **Proposed fix** or mitigation strategy.

## 🔄 Our Response Process

Once a vulnerability report is received:

1. ✅ **Acknowledgment**: You will receive an acknowledgment of your report within **48 hours**.
2. 🔍 **Assessment**: Our team will assess the severity and impact of the reported vulnerability.
3. 🛠️ **Resolution**: We aim to provide a resolution or a public advisory within **7-14 business days**, depending on the complexity of the issue.
4. 📢 **Disclosure**: Public disclosure will be coordinated after a fix has been released.

## 🛡️ Security Best Practices for Investigators

As this is a forensic tool, please adhere to the following security guidelines:

- 🏗️ **Environment Isolation**: Always run the suite in a controlled, isolated forensic environment (e.g., a dedicated VM).
- 🔑 **Credential Management**: Ensure your `.env.local` file is **never** committed to version control. Use strong passwords for the `ADMIN_PASSWORD`.
- 🗄️ **Database Security**: Regularly audit your Supabase **Row Level Security (RLS)** policies to ensure only authorized investigators can access sensitive case data.
- 📦 **Dependency Updates**: Keep your Node.js and Python dependencies updated to the latest stable versions to mitigate upstream vulnerabilities.

---

*Thank you for helping keep the Forensic Pro Suite secure!* 🙏
