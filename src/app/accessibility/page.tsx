import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility — Charta Alba",
  description: "Charta Alba WCAG 2.1 AA accessibility statement, known limitations, and how to request assistance.",
};

export default function AccessibilityPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14" id="main-content">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-white text-3xl font-bold tracking-tight">Accessibility</h1>
          <p className="text-white/40 text-sm mt-2">Last reviewed: April 4, 2026</p>
        </div>

        <div className="space-y-8 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Our commitment</h2>
            <p>
              Charta Alba is committed to ensuring digital accessibility for people with disabilities. We
              aim to conform to the{" "}
              <strong className="text-white/85">Web Content Accessibility Guidelines (WCAG) 2.1, Level AA</strong>.
              We continually improve the user experience for everyone and apply accessibility standards as we
              build and update the platform.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Conformance status</h2>
            <p>
              Charta Alba is <strong className="text-white/85">partially conformant</strong> with WCAG 2.1 Level AA.
              &quot;Partially conformant&quot; means that some content or functionality does not yet fully conform
              to the standard. We are actively working to address known gaps.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-white/4 border border-white/8">
              <p className="text-white/80 font-medium text-sm mb-2">Implemented features</p>
              <ul className="space-y-1.5 text-white/55 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Skip to main content link (first element in the page — press Tab to reveal)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Semantic HTML5 landmarks (<code className="text-white/70">main</code>,{" "}
                  <code className="text-white/70">nav</code>, <code className="text-white/70">header</code>,{" "}
                  <code className="text-white/70">footer</code>)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Keyboard navigation — all interactive elements reachable via Tab / Shift+Tab
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Visible focus indicator on interactive elements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  ARIA labels on icon-only buttons and interactive elements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Screen reader support — announcements for dynamic content updates (toasts, loading states)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Respects <code className="text-white/70">prefers-reduced-motion</code> — all animations are
                  disabled when the system setting is enabled
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Respects <code className="text-white/70">prefers-contrast: high</code> — enhanced border
                  and text contrast in high-contrast mode
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Colour contrast ratios meet or exceed WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  No content flashes more than 3 times per second
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  <code className="text-white/70">lang</code> attribute set on the HTML element
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Form inputs have associated labels and error announcements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5" aria-hidden="true">✓</span>
                  Images and icons have descriptive alternative text or are marked as decorative
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Known limitations</h2>
            <p className="mb-3">
              While we strive for full conformance, we are aware of the following limitations and are working
              to address them:
            </p>
            <ul className="space-y-2">
              {[
                "The vertical-scroll feed uses touch/swipe interactions that may not be fully operable by keyboard alone on all platforms. An alternative list view is on our roadmap.",
                "Some video player controls (YouTube/Vimeo embeds) are provided by third parties; we cannot guarantee their full accessibility.",
                "Complex data tables in the founder dashboard may not be fully optimised for screen readers in all browsers.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 shrink-0" aria-hidden="true">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Technical approach</h2>
            <p>
              Charta Alba is built with Next.js and React. We use semantic HTML elements with ARIA attributes
              where native semantics are insufficient. We test with:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>VoiceOver (macOS / iOS)</li>
              <li>NVDA (Windows)</li>
              <li>Keyboard-only navigation in Chrome and Firefox</li>
              <li>Chrome DevTools Accessibility panel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">User preferences</h2>
            <p>
              You can adjust the following accessibility preferences in{" "}
              <Link href="/settings/privacy" className="text-white/80 hover:text-white underline underline-offset-2">
                Settings → Privacy
              </Link>:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-white/80">Reduce motion</strong> — disables all animations and transitions</li>
              <li><strong className="text-white/80">High contrast</strong> — increases border and text contrast</li>
            </ul>
            <p className="mt-2">
              These settings sync across devices. The platform also automatically respects your system-level
              accessibility settings via CSS media queries.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Feedback & contact</h2>
            <p>
              We welcome your feedback on the accessibility of Charta Alba. If you experience barriers or
              need assistance accessing any content, please contact us:
            </p>
            <div className="mt-3 space-y-2">
              <p>
                <strong className="text-white/80">Email:</strong>{" "}
                <a href="mailto:accessibility@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">
                  accessibility@chartaalba.com
                </a>
              </p>
              <p>
                We aim to respond within <strong className="text-white/80">5 business days</strong> and to
                provide the content in an accessible format within <strong className="text-white/80">30 days</strong>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Formal complaints</h2>
            <p>
              If you are not satisfied with our response, you may contact the relevant enforcement body in your
              jurisdiction. In the UK: the{" "}
              <a
                href="https://www.equalityhumanrights.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white underline underline-offset-2"
              >
                Equality and Human Rights Commission
              </a>. In the EU: your national equality body.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
          <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/data" className="text-white/40 hover:text-white transition-colors">Your Data Rights</Link>
        </div>
      </div>
    </main>
  );
}
