import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Charta Alba",
  description: "How Charta Alba collects, uses, and protects your personal data. GDPR and CCPA compliant.",
};

const UPDATED = "April 4, 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-white font-bold text-lg mb-4 pb-2 border-b border-white/8">{title}</h2>
      <div className="space-y-3 text-white/65 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white/85 font-semibold text-sm mb-2">{title}</h3>
      <div className="space-y-2 text-white/65 text-sm leading-relaxed pl-3 border-l border-white/8">{children}</div>
    </div>
  );
}

function DataTable({ rows }: { rows: [string, string, string, string][] }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-xs mt-2 mb-1 border-collapse min-w-[540px]">
        <thead>
          <tr className="border-b border-white/10">
            {["Data point", "Purpose", "Retention", "Who can see it"].map((h) => (
              <th key={h} className="text-left text-white/40 font-medium py-2 px-3 first:pl-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([data, purpose, retention, who], i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
              <td className="py-2 px-3 pl-4 text-white/70 font-medium">{data}</td>
              <td className="py-2 px-3 text-white/50">{purpose}</td>
              <td className="py-2 px-3 text-white/50">{retention}</td>
              <td className="py-2 px-3 text-white/50">{who}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-2"><span className="text-white/30 shrink-0 mt-0.5">•</span><span>{children}</span></li>;
}

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14" id="main-content">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-white text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-white/40 text-sm mt-2">Last updated: {UPDATED} · Effective immediately</p>
          <p className="text-white/55 text-sm mt-3 leading-relaxed">
            This policy explains exactly what data Charta Alba collects, why, how it is used, and your rights
            under the GDPR (EU), CCPA (California), and other applicable privacy laws.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-green-500/8 border border-green-500/15">
            <p className="text-green-400 text-xs font-medium">
              We do not sell your personal data. We do not serve advertising. We do not use your data to build
              profiles for third parties.
            </p>
          </div>
        </div>

        {/* TOC */}
        <nav aria-label="Table of contents" className="mb-10 p-4 rounded-xl bg-white/3 border border-white/8">
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3 font-medium">Contents</p>
          <ol className="grid sm:grid-cols-2 gap-1">
            {[
              ["#data-collected", "1. Data We Collect"],
              ["#legal-bases", "2. Legal Bases (GDPR)"],
              ["#how-we-use", "3. How We Use Data"],
              ["#data-sharing", "4. Data Sharing"],
              ["#data-transfers", "5. International Transfers"],
              ["#retention", "6. Retention Periods"],
              ["#cookies", "7. Cookies"],
              ["#gdpr-rights", "8. GDPR Rights (EU)"],
              ["#ccpa-rights", "9. CCPA Rights (California)"],
              ["#children", "10. Children"],
              ["#security", "11. Security"],
              ["#changes", "12. Changes to This Policy"],
              ["#contact", "13. Contact Us"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-white/50 hover:text-white text-xs transition-colors">{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-12">

          {/* 1. Data Collected */}
          <Section id="data-collected" title="1. Data We Collect">
            <p>
              We collect the following categories of personal data. We only collect what is necessary for the
              platform to function. Each data point is listed with the purpose and retention period.
            </p>

            <Sub title="1.1 Account Data">
              <DataTable rows={[
                ["Email address", "Login, notifications, password reset", "Until account deletion + 30 days", "You, our team"],
                ["Display name", "Public profile", "Until account deletion + 30 days", "Public"],
                ["Username", "Public profile URL (@handle)", "Until account deletion + 30 days", "Public"],
                ["Password (bcrypt hash)", "Authentication only — never stored in plaintext", "Until changed or account deleted", "Only system (hash only)"],
                ["Profile photo URL", "User-provided external URL for avatar display", "Until changed or account deleted", "Public if profile is public"],
                ["Bio text", "Profile display", "Until changed or account deleted", "Public if profile is public"],
                ["Account creation date", "Security, fraud prevention", "Until account deletion", "You, our team"],
                ["OAuth provider ID", "If you sign in with Google — links your Google account", "Until account disconnected", "You, our team"],
                ["Account type / tier", "Feature gating, billing", "Until account deletion", "You, our team"],
              ]} />
            </Sub>

            <Sub title="1.2 Content Data">
              <DataTable rows={[
                ["Papers saved, liked, bookmarked, rated", "Personalise feed, display engagement counts", "Until action reversed or account deleted", "Like/bookmark counts are public"],
                ["Comments posted", "Display in comment threads", "Until you delete the comment or account", "Public on the platform"],
                ["Collections and contents", "Feature functionality", "Until deleted by you", "Public if collection is public"],
                ["Videos posted (title, description, URL)", "Platform feature", "Until deleted by you", "Public"],
                ["Circles joined and posts made", "Feature functionality", "Until deleted by you or circle owner", "Circle members"],
                ["Search queries", "Improve search (aggregated only)", "Not stored individually", "Not stored"],
                ["Feed filter preferences", "Personalise feed", "Until changed or account deleted", "Not shared"],
                ["ELI5 / Technical mode preference", "Personalise content display", "Until changed or account deleted", "Not shared"],
              ]} />
            </Sub>

            <Sub title="1.3 Location Data">
              <p className="text-amber-400/70 text-xs bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2">
                We derive location from your IP address using offline geolocation (geoip-lite / MaxMind). We do NOT
                access your device GPS, request location permissions, or collect precise coordinates.
              </p>
              <DataTable rows={[
                ["IP address", "Security monitoring, rate limiting, fraud prevention", "12 months", "Our team (founder only for full IP)"],
                ["City (derived from IP)", "Creator analytics (if you opt in), security anomaly detection", "12 months", "Content creators whose profiles you view (opt-in only)"],
                ["Country (derived from IP)", "As above + geographic usage reporting", "12 months", "As above"],
                ["Timezone (derived from IP)", "Security login anomaly detection", "12 months", "Not shared"],
              ]} />
              <p>
                You can opt out of sharing location with content creators at any time in{" "}
                <Link href="/settings/privacy" className="text-white/70 underline hover:text-white">Settings → Privacy</Link>.
                Opting out anonymises city/country in creator analytics while retaining security-related processing.
              </p>
            </Sub>

            <Sub title="1.4 Device &amp; Technical Data">
              <DataTable rows={[
                ["Browser type and version", "Security anomaly detection, compatibility", "12 months", "Not shared"],
                ["Operating system", "Security, compatibility", "12 months", "Not shared"],
                ["Device type (mobile/tablet/desktop)", "Analytics, UI optimisation", "12 months", "Aggregated to content creators"],
                ["Referring URL", "Security, referral tracking", "12 months", "Not shared"],
                ["Pages visited and timestamps", "Security audit log (founder only)", "3 years (audit log)", "Founder only"],
              ]} />
              <p>We do not collect: screen resolution, battery status, accelerometer data, or installed fonts.</p>
            </Sub>

            <Sub title="1.5 Transaction Data">
              <DataTable rows={[
                ["Stripe customer ID", "Link your account to your Stripe billing record", "7 years (tax/legal)", "Our team"],
                ["Subscription tier and billing dates", "Feature gating, support", "7 years", "Our team"],
                ["Points purchase history (amount, date)", "Balance calculation, refund processing", "7 years", "You, our team"],
                ["Refund records", "Compliance", "7 years", "Our team"],
              ]} />
              <p>
                We do NOT store full credit card numbers. Card numbers are handled exclusively by Stripe
                (PCI-DSS compliant). We receive only the last 4 digits and expiry date from Stripe for
                display purposes, and these are stored by Stripe, not by us.
              </p>
            </Sub>

            <Sub title="1.6 API Data (API key holders only)">
              <DataTable rows={[
                ["API requests made (endpoint, timestamp, IP)", "Rate limiting, usage billing, abuse detection", "6 months", "You (via usage dashboard)"],
                ["Response times", "Performance monitoring", "6 months", "Aggregated only"],
                ["API key creation and rotation dates", "Security audit", "3 years", "You, our team"],
              ]} />
            </Sub>

            <Sub title="1.7 Communications Data">
              <DataTable rows={[
                ["Emails sent to you (password reset, notifications)", "Deliver communications you requested", "Until account deletion", "You only"],
                ["Support messages", "Resolve your support request", "3 years", "Our support team"],
              ]} />
              <p>
                <strong className="text-white/80">We do not track email opens or link clicks.</strong>{" "}
                We use Resend for email delivery and have disabled all tracking pixels and click tracking.
              </p>
            </Sub>
          </Section>

          {/* 2. Legal Bases */}
          <Section id="legal-bases" title="2. Legal Bases for Processing (GDPR Article 6)">
            <p>For users in the European Economic Area (EEA), we rely on the following legal bases:</p>
            <ul className="space-y-2">
              <Li>
                <strong className="text-white/80">Contract performance (Article 6(1)(b)):</strong> Processing
                your account data, content data, and transaction data is necessary to provide the service you
                signed up for.
              </Li>
              <Li>
                <strong className="text-white/80">Legitimate interests (Article 6(1)(f)):</strong> Security
                monitoring, fraud prevention, abuse detection, improving platform performance, and sending
                transactional emails about your account. We have balanced these interests against your rights
                and concluded they do not override your privacy interests.
              </Li>
              <Li>
                <strong className="text-white/80">Consent (Article 6(1)(a)):</strong> Marketing
                communications (if you opt in). You can withdraw consent at any time via Settings → Notifications.
              </Li>
              <Li>
                <strong className="text-white/80">Legal obligation (Article 6(1)(c)):</strong> Retaining
                transaction records for tax purposes (7 years), responding to lawful law enforcement requests.
              </Li>
            </ul>
          </Section>

          {/* 3. How We Use Data */}
          <Section id="how-we-use" title="3. How We Use Your Data">
            <ul className="space-y-2">
              <Li>Provide and operate the Charta Alba platform</Li>
              <Li>Authenticate your account and maintain your session</Li>
              <Li>Personalise your research feed based on your interests and history</Li>
              <Li>Display engagement metrics (like counts, view counts) on content</Li>
              <Li>Process points purchases and maintain your points balance</Li>
              <Li>Send transactional emails: password resets, security alerts, notifications you have opted into</Li>
              <Li>Detect and prevent fraud, abuse, and unauthorised access</Li>
              <Li>Monitor platform security (login anomaly detection, rate limiting)</Li>
              <Li>Generate aggregated, anonymised analytics about platform usage</Li>
              <Li>Comply with legal obligations</Li>
            </ul>
            <p>
              <strong className="text-white/80">We do not:</strong> sell your data, serve advertising, build
              profiles for third-party marketing, use your data to train AI models, or make automated decisions
              that produce legal effects about you.
            </p>
          </Section>

          {/* 4. Data Sharing */}
          <Section id="data-sharing" title="4. Data Sharing and Disclosure">
            <p>We share data only as described below. We do not sell personal data.</p>
            <div className="space-y-4">
              {[
                {
                  name: "Neon (Neondatabase)",
                  purpose: "Primary database hosting (PostgreSQL on AWS US-East-1)",
                  data: "All platform data",
                  link: "https://neon.tech/privacy",
                },
                {
                  name: "Vercel",
                  purpose: "Application hosting and global CDN",
                  data: "Request logs, static assets",
                  link: "https://vercel.com/legal/privacy-policy",
                },
                {
                  name: "Stripe",
                  purpose: "Payment processing for subscriptions and points purchases",
                  data: "Name, email, billing info (Stripe handles card data directly)",
                  link: "https://stripe.com/privacy",
                },
                {
                  name: "Resend",
                  purpose: "Transactional email delivery",
                  data: "Your email address and email content",
                  link: "https://resend.com/privacy",
                },
                {
                  name: "Anthropic",
                  purpose: "AI-powered paper summarisation via Claude API",
                  data: "Paper titles and abstracts only — NO personal data is sent to Anthropic",
                  link: "https://anthropic.com/privacy",
                },
              ].map((p) => (
                <div key={p.name} className="p-3 rounded-xl bg-white/3 border border-white/8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/80 font-medium text-sm">{p.name}</span>
                  </div>
                  <p className="text-white/50 text-xs">{p.purpose}</p>
                  <p className="text-white/40 text-xs mt-0.5">Data shared: {p.data}</p>
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 text-xs underline mt-0.5 inline-block transition-colors">
                    Privacy policy ↗
                  </a>
                </div>
              ))}
            </div>
            <p>
              We may disclose information to law enforcement or other authorities when required by applicable law,
              court order, or to protect the safety of our users or the public.
            </p>
          </Section>

          {/* 5. International Transfers */}
          <Section id="data-transfers" title="5. International Data Transfers">
            <p>
              Our primary infrastructure is located in the United States (AWS US-East-1 via Neon, and Vercel's
              US data centres). If you are located in the European Economic Area (EEA), your data is transferred
              to the US.
            </p>
            <ul className="space-y-2">
              <Li>
                <strong className="text-white/80">Stripe:</strong> Transfers covered by EU Standard Contractual
                Clauses (SCCs) and Stripe&apos;s adequacy framework.
              </Li>
              <Li>
                <strong className="text-white/80">Neon / Vercel / Resend / Anthropic:</strong> Transfers made
                on the basis of Standard Contractual Clauses (SCCs) under Article 46(2)(c) GDPR.
              </Li>
            </ul>
            <p>
              You may request a copy of the applicable safeguards by emailing{" "}
              <a href="mailto:privacy@chartaalba.com" className="text-white/70 underline hover:text-white">
                privacy@chartaalba.com
              </a>.
            </p>
          </Section>

          {/* 6. Retention */}
          <Section id="retention" title="6. Data Retention">
            <DataTable rows={[
              ["Account data (email, name, profile)", "Until account deletion + 30 days (backup purge)", "—", "—"],
              ["Login history", "12 months from each login event", "—", "—"],
              ["Location data (IP-derived)", "12 months", "—", "—"],
              ["Content (posts, comments, videos)", "Until deleted by user or account deletion", "—", "—"],
              ["Transaction records", "7 years (tax and legal compliance)", "—", "—"],
              ["API usage logs", "6 months", "—", "—"],
              ["Security audit logs", "3 years", "—", "—"],
              ["Backup copies", "Purged within 90 days of deletion", "—", "—"],
              ["Privacy request records", "3 years (legal compliance)", "—", "—"],
            ]} />
          </Section>

          {/* 7. Cookies */}
          <Section id="cookies" title="7. Cookies">
            <p>
              Charta Alba uses <strong className="text-white/80">only essential cookies</strong>. We do not use
              advertising cookies, analytics cookies, or third-party tracking cookies. A cookie consent banner
              is not required because we only use cookies that are strictly necessary for the service to function.
            </p>
            <div className="p-3 rounded-xl bg-white/3 border border-white/8">
              <p className="text-white/80 font-medium text-sm mb-2">Essential cookies we use:</p>
              <ul className="space-y-1.5 text-xs">
                <li className="flex justify-between gap-4">
                  <span className="text-white/60 font-mono">next-auth.session-token</span>
                  <span className="text-white/40">Your authenticated session (httpOnly, Secure, SameSite=Lax). Expires after 30 days of inactivity.</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-white/60 font-mono">locale</span>
                  <span className="text-white/40">Your language preference. Session duration.</span>
                </li>
              </ul>
            </div>
            <p>
              We do not use Google Analytics, Meta Pixel, or any other third-party analytics or advertising
              services. We do not track you across other websites.
            </p>
          </Section>

          {/* 8. GDPR Rights */}
          <Section id="gdpr-rights" title="8. Your Rights Under GDPR (EU/EEA Residents)">
            <p>If you are located in the European Economic Area, you have the following rights:</p>
            <div className="space-y-3">
              {[
                {
                  right: "Right of Access (Article 15)",
                  desc: "You can request a copy of all personal data we hold about you. We will provide this in a structured, machine-readable format within 30 days.",
                },
                {
                  right: "Right to Rectification (Article 16)",
                  desc: "You can correct inaccurate personal data. Most data can be updated directly in Settings. For other corrections, contact us.",
                },
                {
                  right: "Right to Erasure (Article 17)",
                  desc: "You can request deletion of your account and associated personal data. Some data may be retained where we have a legal obligation (e.g., transaction records for 7 years).",
                },
                {
                  right: "Right to Restriction of Processing (Article 18)",
                  desc: "You can ask us to restrict how we use your data in certain circumstances (e.g., while you contest its accuracy).",
                },
                {
                  right: "Right to Data Portability (Article 20)",
                  desc: "You can request your data exported as JSON or CSV. Available at Settings → Your Account → Download my data.",
                },
                {
                  right: "Right to Object (Article 21)",
                  desc: "You can object to processing based on legitimate interests (e.g., analytics). We will stop unless we have compelling legitimate grounds.",
                },
                {
                  right: "Right Not to Be Subject to Automated Decisions (Article 22)",
                  desc: "We do not make legally significant automated decisions about you. Feed personalisation is not a legal/financial decision.",
                },
              ].map((r) => (
                <div key={r.right} className="p-3 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-white/80 font-medium text-sm">{r.right}</p>
                  <p className="text-white/50 text-xs mt-1">{r.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
              <p className="text-white/70 font-medium text-sm">How to exercise your rights:</p>
              <p className="text-white/50 text-xs">
                Email <a href="mailto:privacy@chartaalba.com" className="text-white/70 underline hover:text-white">privacy@chartaalba.com</a> with
                your request. We will respond within <strong className="text-white/70">30 calendar days</strong>.
                For complex requests, we may extend this by a further 60 days (with notice). We may ask you to
                verify your identity before fulfilling your request.
              </p>
              <p className="text-white/50 text-xs">
                <strong className="text-white/70">Right to lodge a complaint:</strong> If you are unhappy with
                our response, you have the right to lodge a complaint with your national supervisory authority
                (e.g., the ICO in the UK, CNIL in France, BfDI in Germany).
              </p>
            </div>
          </Section>

          {/* 9. CCPA Rights */}
          <Section id="ccpa-rights" title="9. Your Rights Under CCPA (California Residents)">
            <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/15 mb-4">
              <p className="text-green-400 text-sm font-medium">
                We do not sell personal information. We do not share personal information for cross-context
                behavioural advertising. The &ldquo;Do Not Sell or Share My Personal Information&rdquo;
                right is therefore not applicable, but you may still submit a request to confirm this.
              </p>
            </div>
            <p>Under the California Consumer Privacy Act (CCPA/CPRA), California residents have the following rights:</p>
            <ul className="space-y-2">
              <Li><strong className="text-white/80">Right to Know:</strong> You may request disclosure of the categories and specific pieces of personal information we collect about you, the purposes for which we use it, and the categories of third parties with whom we share it.</Li>
              <Li><strong className="text-white/80">Right to Delete:</strong> You may request deletion of your personal information, subject to certain exceptions (e.g., completing transactions, security, legal compliance).</Li>
              <Li><strong className="text-white/80">Right to Correct:</strong> You may request correction of inaccurate personal information.</Li>
              <Li><strong className="text-white/80">Right to Opt-Out of Sale/Sharing:</strong> We do not sell or share personal information for advertising. No opt-out is necessary, but you may confirm this at <Link href="/data" className="text-white/70 underline hover:text-white">our data practices page</Link>.</Li>
              <Li><strong className="text-white/80">Right to Limit Use of Sensitive Personal Information:</strong> We do not process sensitive personal information beyond what is necessary to provide the service.</Li>
              <Li><strong className="text-white/80">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any CCPA rights.</Li>
            </ul>
            <p>
              <strong className="text-white/80">CCPA categories of personal information collected:</strong>{" "}
              Category A (identifiers: email, IP), Category B (customer records: name, billing), Category D
              (commercial information: purchase history), Category F (internet activity: browsing/interaction
              on the platform), Category G (geolocation: city/country from IP).
            </p>
            <p>
              <strong className="text-white/80">Shine the Light (Cal. Civ. Code § 1798.83):</strong>{" "}
              We do not disclose personal information to third parties for their direct marketing purposes.
            </p>
            <p>
              <strong className="text-white/80">Financial Incentives:</strong> The Charta Alba Points system
              constitutes a limited financial incentive. Points have no monetary value. You may opt out of the
              Points program by not engaging with earning activities. See Terms of Service §12 for full details.
            </p>
            <p>
              To exercise CCPA rights, email{" "}
              <a href="mailto:privacy@chartaalba.com" className="text-white/70 underline hover:text-white">privacy@chartaalba.com</a> or
              visit our <Link href="/data" className="text-white/70 underline hover:text-white">Request Center</Link>.
              We will respond within <strong className="text-white/70">45 calendar days</strong> (extendable by 45 days with notice).
            </p>
          </Section>

          {/* 10. Children */}
          <Section id="children" title="10. Children's Privacy">
            <p>
              Charta Alba is not directed at children under the age of 13. We do not knowingly collect personal
              data from children under 13. If you believe a child under 13 has provided us with personal data,
              please contact us immediately at{" "}
              <a href="mailto:privacy@chartaalba.com" className="text-white/70 underline hover:text-white">privacy@chartaalba.com</a> and
              we will take steps to delete that information promptly.
            </p>
            <p>
              For users aged 13–17: we recommend parental guidance when using the platform. We do not knowingly
              sell or share personal information of minors under 16 for advertising purposes.
            </p>
          </Section>

          {/* 11. Security */}
          <Section id="security" title="11. Security">
            <ul className="space-y-2">
              <Li>Passwords stored as bcrypt hashes (cost factor 12) — never in plaintext</Li>
              <Li>All connections encrypted with TLS 1.2+ (HTTPS enforced)</Li>
              <Li>Database at rest encryption (Neon / AWS)</Li>
              <Li>TOTP multi-factor authentication for administrative access</Li>
              <Li>Account lockout after 10 failed login attempts</Li>
              <Li>Login anomaly detection (new country/device alerts)</Li>
              <Li>Immutable audit log for all administrative actions</Li>
            </ul>
            <p>
              No method of transmission over the internet or electronic storage is 100% secure. We cannot
              guarantee absolute security but we implement industry-standard safeguards and continuously
              improve our practices.
            </p>
            <p>
              To report a security vulnerability, email{" "}
              <a href="mailto:security@chartaalba.com" className="text-white/70 underline hover:text-white">security@chartaalba.com</a>.
              See our <a href="/SECURITY.md" className="text-white/70 underline hover:text-white">Security Policy</a> for our responsible disclosure programme.
            </p>
          </Section>

          {/* 12. Changes */}
          <Section id="changes" title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. If we make material changes, we will notify you by
              email (to the address on your account) and/or by prominently displaying a notice on the platform
              at least <strong className="text-white/80">30 days</strong> before the changes take effect.
            </p>
            <p>
              Continued use of Charta Alba after the effective date of updated terms constitutes acceptance.
              The &ldquo;Last updated&rdquo; date at the top of this page indicates when the policy was most
              recently revised.
            </p>
          </Section>

          {/* 13. Contact */}
          <Section id="contact" title="13. Contact Us">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Privacy enquiries & rights requests", email: "privacy@chartaalba.com", desc: "GDPR / CCPA requests, data access, corrections" },
                { label: "Security vulnerabilities", email: "security@chartaalba.com", desc: "Responsible disclosure only" },
                { label: "General support", email: "support@chartaalba.com", desc: "Account issues, feature questions" },
                { label: "Legal / DMCA", email: "legal@chartaalba.com", desc: "Copyright notices, legal enquiries" },
              ].map((c) => (
                <div key={c.email} className="p-3 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-white/70 font-medium text-sm">{c.label}</p>
                  <a href={`mailto:${c.email}`} className="text-white/50 hover:text-white text-xs underline transition-colors">{c.email}</a>
                  <p className="text-white/30 text-xs mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-xs">
              Response time: 30 days for GDPR requests, 45 days for CCPA requests.
              We may extend these deadlines by the maximum permitted period for complex requests and will notify
              you if we do so.
            </p>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
          <Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/data" className="text-white/40 hover:text-white transition-colors">Data Practices</Link>
          <Link href="/accessibility" className="text-white/40 hover:text-white transition-colors">Accessibility</Link>
          <Link href="/help" className="text-white/40 hover:text-white transition-colors">Help</Link>
        </div>
      </div>
    </main>
  );
}
