import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Charta Alba",
  description: "Charta Alba Terms of Service including intellectual property, prohibited content, points, API terms, disclaimers, and governing law.",
};

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      <div className="space-y-3 text-white/70 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white/85 font-medium mb-1">{title}</h3>
      <div className="text-white/65">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14" id="main-content">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-white text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-white/40 text-sm mt-2">Last updated: April 4, 2026 · Effective: April 4, 2026</p>
          <p className="text-white/50 text-sm mt-3">
            Please read these Terms carefully before using Charta Alba. By creating an account or
            using any part of the platform you agree to be bound by these Terms and our{" "}
            <Link href="/privacy" className="text-white/80 hover:text-white underline underline-offset-2">
              Privacy Policy
            </Link>.
          </p>
        </div>

        {/* Table of Contents */}
        <nav aria-label="Table of contents" className="mb-10 p-4 rounded-xl bg-white/4 border border-white/8">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Contents</p>
          <ol className="space-y-1.5 text-sm text-white/50">
            {[
              ["#acceptance", "1. Acceptance & Age"],
              ["#ip", "2. Intellectual Property"],
              ["#prohibited", "3. Prohibited Content & Conduct"],
              ["#dmca", "4. DMCA / Copyright"],
              ["#points", "5. Points & Virtual Currency"],
              ["#api", "6. API Terms"],
              ["#disclaimers", "7. Disclaimers"],
              ["#liability", "8. Limitation of Liability"],
              ["#governing-law", "9. Governing Law & Disputes"],
              ["#termination", "10. Termination"],
              ["#changes", "11. Changes to These Terms"],
              ["#contact", "12. Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="hover:text-white transition-colors">{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">

          {/* 1. Acceptance & Age */}
          <Section id="acceptance" title="1. Acceptance & Age">
            <p>
              By accessing or using Charta Alba (the &quot;Platform&quot;), you agree to these Terms of Service
              (&quot;Terms&quot;) and our Privacy Policy. If you are entering into these Terms on behalf of an
              organisation, you represent that you have authority to bind that organisation.
            </p>
            <Sub title="Age requirement">
              <p>
                You must be at least <strong>13 years old</strong> to use Charta Alba. If you are between 13 and 18,
                a parent or legal guardian must review and agree to these Terms on your behalf. We do not knowingly
                collect personal data from children under 13. If we become aware of such collection we will delete
                the relevant data immediately.
              </p>
            </Sub>
            <Sub title="Account security">
              <p>
                You are responsible for maintaining the confidentiality of your credentials and for all activity
                that occurs under your account. Notify us immediately at{" "}
                <a href="mailto:security@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">
                  security@chartaalba.com
                </a>{" "}
                if you suspect unauthorised access.
              </p>
            </Sub>
          </Section>

          {/* 2. Intellectual Property */}
          <Section id="ip" title="2. Intellectual Property">
            <Sub title="Platform content">
              <p>
                The Charta Alba name, logo, source code, design system, and original written content are the
                property of Charta Alba and its licensors, protected by copyright, trademark, and other intellectual
                property laws. Nothing in these Terms grants you a right to use our branding without prior written
                consent.
              </p>
            </Sub>
            <Sub title="User content licence">
              <p>
                You retain full ownership of content you post (&quot;User Content&quot;: comments, replies, profile
                information). By posting User Content you grant Charta Alba a worldwide, non-exclusive, royalty-free,
                sublicensable licence to host, display, reproduce, distribute, and create derivative works of that
                content solely for operating and improving the Platform. This licence ends when you delete the
                content or your account.
              </p>
            </Sub>
            <Sub title="arXiv metadata">
              <p>
                Paper metadata is sourced from arXiv.org under the arXiv non-exclusive distribution licence.
                arXiv papers are the property of their respective authors. Charta Alba does not claim ownership
                of any academic paper, its contents, or associated data.
              </p>
            </Sub>
            <Sub title="AI-generated summaries">
              <p>
                Explainer cards are generated using the Anthropic Claude API. These summaries are derivative
                works intended for informational purposes only. They do not represent the views of paper authors,
                their institutions, or arXiv.
              </p>
            </Sub>
          </Section>

          {/* 3. Prohibited Content */}
          <Section id="prohibited" title="3. Prohibited Content & Conduct">
            <p>You agree not to post, transmit, or facilitate any content or conduct that:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Is unlawful, defamatory, obscene, harassing, threatening, or invasive of privacy</li>
              <li>Infringes any intellectual property, privacy, or other right of any person or entity</li>
              <li>Contains malware, viruses, or any harmful or disruptive code</li>
              <li>Constitutes spam, unsolicited mass messaging, or commercial advertising without consent</li>
              <li>Involves impersonating any person or entity, or misrepresenting your affiliation</li>
              <li>Promotes or facilitates violence, terrorism, or discrimination based on protected characteristics</li>
              <li>Attempts to scrape, crawl, or systematically download Platform content without written permission</li>
              <li>Circumvents authentication, rate limiting, or other technical measures</li>
              <li>Manipulates engagement metrics (e.g., fake likes, bot follows, vote rings)</li>
              <li>Violates any applicable law or regulation</li>
            </ul>
            <p>
              We reserve the right to remove any content that violates these Terms and to suspend or terminate
              accounts engaged in prohibited conduct. Serious violations may be reported to law enforcement.
            </p>
          </Section>

          {/* 4. DMCA / Copyright */}
          <Section id="dmca" title="4. DMCA / Copyright">
            <Sub title="Reporting infringement">
              <p>
                If you believe that content on the Platform infringes your copyright, send a written notice to
                our designated DMCA agent at{" "}
                <a href="mailto:dmca@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">
                  dmca@chartaalba.com
                </a>{" "}
                containing: (a) your contact information; (b) identification of the copyrighted work; (c)
                identification of the infringing material and its location on the Platform; (d) a statement that
                you have a good faith belief that the use is not authorised; (e) a statement, under penalty of
                perjury, that the information is accurate and you are the copyright owner or authorised to act on
                their behalf; and (f) your physical or electronic signature.
              </p>
            </Sub>
            <Sub title="Counter-notification">
              <p>
                If your content was removed in error, you may submit a counter-notice to the same address. We
                will restore the content unless the complainant files a court action within 10 business days.
              </p>
            </Sub>
            <Sub title="Repeat infringers">
              <p>
                Accounts found to repeatedly infringe third-party copyrights will be terminated.
              </p>
            </Sub>
          </Section>

          {/* 5. Points */}
          <Section id="points" title="5. Points & Virtual Currency">
            <p>
              Charta Alba Points (&quot;Points&quot;) are a virtual engagement feature. The following terms govern
              their use:
            </p>
            <Sub title="No monetary value">
              <p>
                Points have no monetary value, cannot be redeemed for cash or cash equivalents, and do not
                constitute a financial instrument, security, or currency of any kind. Nothing in these Terms
                or on the Platform should be construed as creating a financial product.
              </p>
            </Sub>
            <Sub title="Non-transferable">
              <p>
                Points are personal to your account. You may not sell, gift, transfer, or assign Points to any
                other user or third party. Any attempted transfer is void and may result in account suspension.
              </p>
            </Sub>
            <Sub title="Purchases & refunds">
              <p>
                Points may be purchased via Stripe. Purchased Points are subject to a <strong>48-hour refund
                window</strong>, provided the Points have not been spent. After 48 hours or once any Points are
                used, purchases are final. Approved refunds are processed to the original payment method within
                5–10 business days.
              </p>
            </Sub>
            <Sub title="Expiry">
              <p>
                Points expire if your account is inactive for 12 consecutive months (&quot;inactive&quot; meaning
                no login, post, comment, or purchase). We will send a reminder email 30 days before expiry.
                Expired Points cannot be restored.
              </p>
            </Sub>
            <Sub title="Modification of point values">
              <p>
                We may modify earn rates, spend costs, and package prices. We will provide at least 30 days&apos;
                notice before reducing the value of already-earned Points or increasing spend costs.
              </p>
            </Sub>
            <Sub title="Revocation">
              <p>
                Points may be forfeited without compensation if your account is suspended or terminated for
                violations of these Terms, including manipulation of the earning system, self-voting, use of
                automated accounts, or any fraudulent activity.
              </p>
            </Sub>
            <Sub title="Account closure">
              <p>
                Upon account deletion, all Points are permanently forfeited. There is no cash equivalent for
                outstanding Points at closure.
              </p>
            </Sub>
          </Section>

          {/* 6. API Terms */}
          <Section id="api" title="6. API Terms">
            <Sub title="API access">
              <p>
                Access to the Charta Alba API is subject to these Terms plus any additional API documentation
                we publish. API keys are personal to the account that generated them and must not be shared or
                published in public repositories.
              </p>
            </Sub>
            <Sub title="Rate limits">
              <p>
                API requests are subject to rate limits specified in the developer documentation. Circumventing
                rate limits (e.g., using multiple accounts or IP rotation) is prohibited.
              </p>
            </Sub>
            <Sub title="Permitted use">
              <p>
                API access is permitted for: building applications that display Charta Alba content with
                proper attribution; personal automation; academic research. It is not permitted to: resell API
                access; build competing aggregation services; or train machine-learning models on the response
                data without express written consent.
              </p>
            </Sub>
            <Sub title="Attribution">
              <p>
                Applications built using our API must display &quot;Powered by Charta Alba&quot; or similar
                attribution in a reasonably prominent location.
              </p>
            </Sub>
            <Sub title="Suspension">
              <p>
                We may suspend or revoke API access at any time for violations of these Terms or for any
                business reason with reasonable notice where practicable.
              </p>
            </Sub>
          </Section>

          {/* 7. Disclaimers */}
          <Section id="disclaimers" title="7. Disclaimers">
            <p>
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              AI-generated summaries are for informational purposes only. They may contain errors, omissions, or
              misinterpretations of the source material. <strong>They are not scientific advice, medical advice,
              financial advice, or legal advice.</strong> You should always consult the original paper and, where
              applicable, qualified professionals before acting on any information.
            </p>
            <p>
              We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other
              harmful components. We do not warrant the accuracy or completeness of any content on the Platform.
            </p>
          </Section>

          {/* 8. Limitation of Liability */}
          <Section id="liability" title="8. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CHARTA ALBA AND ITS OPERATORS, DIRECTORS,
              EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM OR
              RELATED TO YOUR USE OF OR INABILITY TO USE THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF
              SUCH DAMAGES.
            </p>
            <p>
              WHERE LIABILITY CANNOT BE EXCLUDED BY LAW, OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS
              ARISING FROM OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) THE
              AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) £100 GBP.
            </p>
            <p className="text-white/50 text-xs">
              Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities.
              In those jurisdictions, our liability is limited to the maximum extent permitted by applicable law.
            </p>
          </Section>

          {/* 9. Governing Law */}
          <Section id="governing-law" title="9. Governing Law & Disputes">
            <Sub title="Governing law">
              <p>
                These Terms are governed by and construed in accordance with the laws of England and Wales,
                without regard to conflict-of-law principles. If you are a consumer resident in the EEA or UK,
                you also benefit from the mandatory protections of consumer law in your country of residence.
              </p>
            </Sub>
            <Sub title="Informal resolution">
              <p>
                Before initiating any formal dispute process, you agree to first contact us at{" "}
                <a href="mailto:support@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">
                  support@chartaalba.com
                </a>{" "}
                and attempt to resolve the dispute informally. We will make good-faith efforts to resolve any
                issues within 30 days.
              </p>
            </Sub>
            <Sub title="Jurisdiction">
              <p>
                If informal resolution fails, you agree to submit to the exclusive jurisdiction of the courts
                of England and Wales, unless mandatory consumer law in your jurisdiction provides otherwise.
              </p>
            </Sub>
          </Section>

          {/* 10. Termination */}
          <Section id="termination" title="10. Termination">
            <Sub title="Termination by us">
              <p>
                We may suspend or terminate your account and access to the Platform at any time, with or without
                notice, if we believe you have violated these Terms or if we discontinue the Platform. For
                non-material violations we will generally issue a warning first.
              </p>
            </Sub>
            <Sub title="Termination by you">
              <p>
                You may delete your account at any time via <strong>Settings → Your Account → Delete Account</strong>.
                Upon deletion: your profile becomes inaccessible, your comments are anonymised, and any Points are
                forfeited. You may submit a data deletion request under{" "}
                <Link href="/data" className="text-white/80 hover:text-white underline underline-offset-2">Your Data Rights</Link>.
              </p>
            </Sub>
            <Sub title="Survival">
              <p>
                Sections 2 (Intellectual Property), 7 (Disclaimers), 8 (Limitation of Liability), and 9
                (Governing Law) survive termination.
              </p>
            </Sub>
          </Section>

          {/* 11. Changes */}
          <Section id="changes" title="11. Changes to These Terms">
            <p>
              We may revise these Terms from time to time. When we make material changes we will update the
              &quot;Last updated&quot; date above and, where practical, notify you by email or via an in-app notice
              at least 14 days before the changes take effect. Your continued use of the Platform after the
              effective date constitutes acceptance of the revised Terms. If you do not agree to the changes, you
              must stop using the Platform and may delete your account.
            </p>
          </Section>

          {/* 12. Contact */}
          <Section id="contact" title="12. Contact">
            <p>
              Questions about these Terms? We&apos;re happy to help:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>General: <a href="mailto:support@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">support@chartaalba.com</a></li>
              <li>Security: <a href="mailto:security@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">security@chartaalba.com</a></li>
              <li>Copyright / DMCA: <a href="mailto:dmca@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">dmca@chartaalba.com</a></li>
              <li>Privacy / Data requests: <Link href="/data" className="text-white/80 hover:text-white underline underline-offset-2">Your Data Rights page</Link></li>
            </ul>
          </Section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
          <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/data" className="text-white/40 hover:text-white transition-colors">Your Data Rights</Link>
          <Link href="/accessibility" className="text-white/40 hover:text-white transition-colors">Accessibility</Link>
        </div>
      </div>
    </main>
  );
}
