import Link from "next/link";

interface FAQ { q: string; a: string }

const SECTIONS: { title: string; faqs: FAQ[] }[] = [
  {
    title: "Getting Started",
    faqs: [
      { q: "What is Charta Alba?", a: "Charta Alba is a mobile-first platform that transforms AI and machine learning research papers into short, digestible explainer cards — think TikTok for academic papers. Swipe through the feed, like papers, bookmark your favourites, and follow topics you care about." },
      { q: "How do I sign up?", a: "Click 'Sign in' in the top navigation and choose to sign in with Google or create an account with an email and password. Creating an account is free." },
      { q: "Is Charta Alba free?", a: "Yes, completely. Charta Alba is free to use. Creating an account and accessing the full feed costs nothing." },
    ],
  },
  {
    title: "Feed & Discovery",
    faqs: [
      { q: "How does the feed work?", a: "By default, your feed shows trending papers — top-liked cards from the past 7 days. You can switch to Chronological or Following-only modes in Settings → Personalization." },
      { q: "What is ELI5 mode?", a: "ELI5 (Explain Like I'm 5) mode rewrites a paper's summary in simple language using Claude AI. Tap the 'ELI5' button on any card to activate it." },
      { q: "How do I follow topics?", a: "Tap any tag on a paper card (e.g. 'cs.AI', 'transformers') and select Follow. Followed topics appear prominently in your feed." },
      { q: "Can I search for papers?", a: "Yes — use the search bar in the top navigation to find papers by title or keyword." },
    ],
  },
  {
    title: "Papers & Research",
    faqs: [
      { q: "How do I claim my paper?", a: "On a paper's card, tap the 'Claim' button and provide your ORCID ID or institutional email. Claims are reviewed within 2–5 business days." },
      { q: "What is replication status?", a: "Replication status indicates whether a paper's results have been independently verified. We source this from community annotations and partner organisations." },
      { q: "Where do the papers come from?", a: "Papers are automatically imported daily from arXiv — primarily cs.AI and cs.LG categories. The pipeline uses Claude to generate the explainer cards." },
      { q: "How often is the feed updated?", a: "New papers are seeded daily at midnight UTC from arXiv's latest submissions." },
    ],
  },
  {
    title: "Videos",
    faqs: [
      { q: "How do I post a video?", a: "Go to the Videos section and tap 'Post video'. Provide a title, description, and a URL to the video (YouTube, Vimeo, or any direct MP4 link). You can optionally link it to a paper." },
      { q: "What video formats are supported?", a: "Any publicly accessible video URL works, including YouTube, Vimeo, and direct video files. Videos are embedded in the Charta Alba interface." },
      { q: "Can I delete my video?", a: "Yes — tap the three-dot menu on your video to delete it." },
    ],
  },
  {
    title: "Circles",
    faqs: [
      { q: "What are Circles?", a: "Circles are research collaboration groups where members can share papers, videos, and discussion posts within a focused community. They're organised around topics or teams." },
      { q: "How do I create a Circle?", a: "Go to Circles in the navigation and click 'New Circle'. Set a name, description, and topic tags. You can make a Circle public or private." },
      { q: "How do I join a Circle?", a: "Browse public Circles and click 'Join'. Private Circles require an invitation from the owner." },
      { q: "What can I post in a Circle?", a: "Members can post discussion threads. Paper and video linking is coming soon." },
    ],
  },
  {
    title: "Account & Settings",
    faqs: [
      { q: "How do I change my password?", a: "Go to Settings → Security & Account Access → Change password. You'll need your current password." },
      { q: "How do I change my email?", a: "Go to Settings → Your Account → Change email. Enter your new address and we'll send a verification link to your current email first, then to the new one." },
      { q: "Can I set a username?", a: "Yes — go to Settings → Your Account and set your @handle. Usernames are 3–20 characters (letters, numbers, underscores)." },
      { q: "How do I deactivate my account?", a: "Go to Settings → Your Account → Deactivate account. Your profile will be hidden. You can reactivate by signing back in." },
    ],
  },
  {
    title: "Privacy & Safety",
    faqs: [
      { q: "How do I make my account private?", a: "Go to Settings → Privacy & Safety and enable 'Private account'. Only approved followers will see your posts." },
      { q: "How do I mute words?", a: "Go to Settings → Privacy & Safety → Muted keywords and add any words you want hidden from your feed." },
      { q: "How do I block someone?", a: "Full block management is coming soon. For now, contact support@chartaalba.com if you have a safety concern." },
      { q: "What data does Charta Alba collect?", a: "We collect only what's needed to run the platform: your email, display name, and interaction history (likes, bookmarks, follows). We never sell your data. See our Privacy Policy for full details." },
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-white text-3xl font-bold tracking-tight">Help Center</h1>
          <p className="text-white/45 mt-2">Find answers to common questions about Charta Alba.</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(({ title, faqs }) => (
            <section key={title}>
              <h2 className="text-white font-semibold text-base mb-4 pb-2 border-b border-white/8">{title}</h2>
              <div className="space-y-5">
                {faqs.map(({ q, a }) => (
                  <div key={q}>
                    <h3 className="text-white/90 text-sm font-medium mb-1.5">{q}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 p-6 rounded-2xl bg-white/4 border border-white/8 text-center space-y-3">
          <h2 className="text-white font-semibold text-base">Still need help?</h2>
          <p className="text-white/50 text-sm">Our team is happy to assist. Typical response time: 1–2 business days.</p>
          <a
            href="mailto:support@chartaalba.com"
            className="inline-block px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Email support@chartaalba.com
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-white/8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
          <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
