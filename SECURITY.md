# Security Policy — Charta Alba

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Email us directly at **security@chartaalba.com**. Include:

- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept code or request/response examples)
- The potential impact you believe it has
- Your preferred contact method for follow-up

We will acknowledge your report within **48 hours** and aim to issue a fix within **7 days** for critical issues, or communicate a timeline for lower-severity findings.

We ask that you:
- Give us reasonable time to address the issue before public disclosure
- Do not access, modify, or delete user data beyond what is needed to demonstrate the vulnerability
- Do not perform DoS/DDoS attacks or disrupt service availability

## Scope

### In scope
- All production API endpoints (`https://chartaalba.com/api/**`)
- Authentication and session management flows
- Data access controls and IDOR vulnerabilities
- Injection vulnerabilities (SQL, command, etc.)
- Cross-site scripting (XSS) in user-facing pages
- Cryptographic weaknesses in password hashing or token generation
- Sensitive data exposure in API responses

### Out of scope
- Denial of service attacks
- Social engineering or phishing
- Vulnerabilities in third-party services (Neon, Vercel, Stripe, Google OAuth)
- Issues that require physical access to infrastructure
- Scanner output without proof of exploitability

## Hall of Fame

Researchers who responsibly disclose valid vulnerabilities are credited here (with permission):

| Researcher | Finding | Date |
|-----------|---------|------|
| *(first entry pending)* | | |

## Security Architecture Notes

- Passwords: bcrypt, cost factor 12
- Sessions: JWT signed with `NEXTAUTH_SECRET` (min 32 chars), 30-day expiry
- Founder sessions: 4-level TOTP verification, 15-minute window
- All user inputs: sanitized at API boundary (null bytes stripped, length capped)
- SQL: Drizzle ORM parameterized queries only — no string concatenation
- API keys: SHA-256 hashed at rest, prefix shown in UI
- TOTP secrets: AES-256-GCM encrypted at rest
- Audit log: DB-level immutability trigger (rows cannot be modified or deleted)
- Video/image URLs: allowlist validation, SSRF protection
- Rate limiting: in-memory per-IP on auth endpoints
- Account lockout: 10 failed attempts → 30-minute lock
