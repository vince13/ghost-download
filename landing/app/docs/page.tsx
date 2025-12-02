import Link from "next/link";
import { BookOpen, LifeBuoy, ArrowLeft } from "lucide-react";

const docs = [
  {
    title: "User Guide",
    description:
      "Onboarding, HUD overview, knowledge base, playbooks, analytics, plans, and best practices.",
    href: "/docs/user-guide",
    icon: BookOpen,
  },
  {
    title: "Troubleshooting",
    description:
      "Fix blank screens, deployment errors, Stripe issues, Firestore rules, embeddings, and more.",
    href: "/docs/troubleshooting",
    icon: LifeBuoy,
  },
];

export default function DocsHomePage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to landing page
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400">Docs</p>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Everything you need to run Ghost
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We distilled onboarding, workflows, and fix-it checklists into two living documents.
            Read them before your next negotiation and bookmark for the team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {docs.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group border border-gray-800 rounded-2xl p-6 bg-gray-950 hover:border-blue-500/70 transition-all shadow-lg hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-900/30 border border-blue-800/50 flex items-center justify-center text-blue-300 mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">{title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              <span className="inline-flex items-center gap-2 text-blue-300 mt-4 text-sm">
                Read guide
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

