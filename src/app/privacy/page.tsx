import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-white text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-white/40 text-sm mt-2">Last updated: March 2026</p>
        </div>

        <div className="space-y-8 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, such as your name, email address, and profile information. We also collect information about your interactions with Charta Alba, including papers you like, bookmark, and topics you follow.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to operate and improve Charta Alba, personalise your feed, send you notifications you have opted into, and communicate with you about your account. We do not use your data to serve advertising.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal data to third parties. We may share data with service providers who help us operate the platform (such as hosting and email providers), subject to confidentiality obligations. We may disclose information when required by law.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at support@chartaalba.com.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">5. Cookies</h2>
            <p>Charta Alba uses cookies and similar technologies to maintain your session and remember your preferences. We do not use cookies for advertising or cross-site tracking.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">6. Security</h2>
            <p>We use industry-standard security measures to protect your information, including encrypted connections (HTTPS) and hashed password storage. No method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">7. Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, or delete the personal data we hold about you. To exercise these rights, contact us at support@chartaalba.com.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a notice on the platform. Continued use of Charta Alba after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">9. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:support@chartaalba.com" className="text-white hover:underline">support@chartaalba.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
          <Link href="/help" className="text-white/40 hover:text-white transition-colors">Help Center</Link>
          <Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
