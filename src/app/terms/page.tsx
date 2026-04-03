import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-white text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-white/40 text-sm mt-2">Last updated: March 2026</p>
        </div>

        <div className="space-y-8 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Charta Alba, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">2. Eligibility</h2>
            <p>You must be at least 13 years old to use Charta Alba. By using the platform, you represent that you meet this requirement.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">3. Your Account</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@chartaalba.com if you suspect unauthorised access.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">4. User Content</h2>
            <p>You retain ownership of content you post (comments, Circle posts, video descriptions). By posting content, you grant Charta Alba a non-exclusive, royalty-free licence to display and distribute that content on the platform. You are solely responsible for the content you post and must not post content that is illegal, harmful, or infringes third-party rights.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">5. Intellectual Property</h2>
            <p>Charta Alba and its original content (excluding user content and arXiv paper metadata) are the property of Charta Alba and its licensors. Paper metadata sourced from arXiv is subject to arXiv's terms of use. AI-generated explainer cards are generated using Claude and are provided for informational purposes.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">6. Prohibited Conduct</h2>
            <p>You agree not to: (a) use the platform for any unlawful purpose; (b) harass, abuse, or harm others; (c) attempt to gain unauthorised access to the platform or other users' accounts; (d) scrape or automate access to the platform without permission; (e) post spam or misleading content.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">7. Disclaimers</h2>
            <p>Charta Alba is provided "as is" without warranties of any kind. AI-generated summaries are for informational purposes only and may contain errors. We do not guarantee the accuracy, completeness, or fitness for any purpose of any content on the platform.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Charta Alba and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may delete your account at any time via Settings → Your Account.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance. We will notify you of material changes by email or via a platform notice.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">11. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:support@chartaalba.com" className="text-white hover:underline">support@chartaalba.com</a>.</p>
          </section>

          <section id="points">
            <h2 className="text-white font-semibold text-base mb-3">12. Charta Alba Points</h2>
            <div className="space-y-3">
              <p><strong className="text-white/80">No monetary value.</strong> Charta Alba Points (&quot;Points&quot;) are a virtual engagement feature only. Points have no monetary value, cannot be redeemed for cash or cash equivalents, and do not constitute a financial instrument, security, or currency of any kind.</p>
              <p><strong className="text-white/80">Non-transferable.</strong> Points are personal to your account. You may not sell, gift, transfer, or assign Points to any other user. Any attempted transfer is void.</p>
              <p><strong className="text-white/80">Expiry.</strong> Points expire if your account is inactive for 12 consecutive months. &quot;Inactive&quot; means no login, post, comment, or purchase during that period. We will send an email reminder 30 days before expiry. Expired Points cannot be restored.</p>
              <p><strong className="text-white/80">Purchases.</strong> Purchased Points are subject to a 48-hour refund window, provided the Points have not been spent. After 48 hours or once any Points are used, purchases are final. Refunds are processed to the original payment method within 5–10 business days.</p>
              <p><strong className="text-white/80">Platform feature, not a financial product.</strong> The Points system is a platform engagement mechanism. It is not a loyalty programme subject to consumer credit regulation, a virtual currency subject to money transmission law, or a deposit product. Charta Alba is not a financial institution.</p>
              <p><strong className="text-white/80">Modification of point values.</strong> We reserve the right to modify earn rates, spend costs, and package prices. We will provide at least 30 days&apos; notice before reducing the value of already-earned Points or increasing spend costs. New earning rules may be introduced without notice.</p>
              <p><strong className="text-white/80">Revocation for ToS violations.</strong> Points may be forfeited without compensation if your account is suspended or terminated for violations of these Terms, including but not limited to: manipulation of the earning system, self-voting, use of automated accounts, or any fraudulent activity.</p>
              <p><strong className="text-white/80">Account closure.</strong> Upon account deletion, all Points are permanently forfeited. There is no cash equivalent for outstanding Points at closure.</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
          <Link href="/help" className="text-white/40 hover:text-white transition-colors">Help Center</Link>
          <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}
