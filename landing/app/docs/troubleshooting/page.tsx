import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";

const issues = [
  {
    title: "Blank page at /app",
    cause: "Assets requested from /assets instead of /app/assets",
    fix: "Ensure `base: '/app/'` is set in `app/vite.config.js`, rebuild, redeploy.",
  },
  {
    title: "Vercel deploy error: src has to be package.json",
    cause: "Next.js build configuration pointed to next.config.ts",
    fix: "Set `src: \"landing/package.json\"` for the `@vercel/next` build in `vercel.json`.",
  },
  {
    title: "Stripe checkout doesn’t upgrade plan",
    cause: "Missing Stripe env vars or webhook failure",
    fix: "Set `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`, check `/api/stripe-webhook` logs in Vercel.",
  },
  {
    title: "Firestore “Missing or insufficient permissions”",
    cause: "Rules not deployed / user doc missing",
    fix: "Run `firebase deploy --only firestore:rules` using `FIRESTORE_RULES_DEPLOY.md` guide.",
  },
  {
    title: "KB upload stuck at chunking",
    cause: "No embedding service keys configured",
    fix: "Provide `JINA_API_KEY` (preferred) or `OPENAI_API_KEY`, redeploy, re-upload document.",
  },
  {
    title: "LLM cues not appearing",
    cause: "Process-transcript failing or no LLM API keys",
    fix: "Check `/api/process-transcript` logs, ensure `GROQ_API_KEY` or `GEMINI_API_KEY` set.",
  },
  {
    title: "Vapi assistant speaking out loud",
    cause: "Webhook not intercepting assistant responses",
    fix: "Ensure `/api/v2v-webhook` returns empty object for assistant messages and frontend calls `stopAssistantSpeech()`.",
  },
  {
    title: "Auth keeps reverting to Guest",
    cause: "Google session not persisted",
    fix: "Confirm `browserLocalPersistence` is enabled (it is) and that Google domain is authorized.",
  },
  {
    title: "Session replay empty",
    cause: "Plan doesn’t allow or Firestore write failed",
    fix: "Check entitlements; verify `users/{uid}/sessions/{sessionId}` exists with subcollections.",
  },
  {
    title: "No embedding service available",
    cause: "Jina/HF/OpenAI keys missing or failing",
    fix: "Set at least one embedding key, redeploy, re-run upload (see TESTING_RAG.md).",
  },
  {
    title: "Need logs fast",
    cause: "Hard to debug without Vercel output",
    fix: "`vercel logs ghost-green --since 10m` or open Vercel dashboard → Functions.",
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to docs
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-8">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.4em] uppercase text-blue-400">
              <LifeBuoy className="w-4 h-4" />
              Fix it
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold">Troubleshooting Playbook</h1>
            <p className="text-lg text-gray-400">
              Quick fixes for the most common deployment and runtime issues. Check here before diving into logs.
            </p>
          </div>

          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.title} className="border border-gray-800 rounded-2xl p-5 bg-gray-950">
                <h2 className="text-xl font-semibold text-white">{issue.title}</h2>
                <p className="text-sm text-gray-500 mt-2">Cause: {issue.cause}</p>
                <p className="text-sm text-blue-300 mt-1">Fix: {issue.fix}</p>
              </div>
            ))}
          </div>

          <div className="border border-gray-800 rounded-2xl p-6 bg-gray-950 text-sm text-gray-300 space-y-2">
            <p>
              Still stuck? Email <a href="mailto:support@ghostprotocol.ai" className="text-blue-300">support@ghostprotocol.ai</a>
            </p>
            <p>
              For enterprise escalations: <a href="mailto:sales@ghostprotocol.ai" className="text-blue-300">sales@ghostprotocol.ai</a>
            </p>
            <p>See also: HOW_TO_CHECK_LOGS.md, VERCEL_ENV_SETUP.md, TESTING_RAG.md</p>
          </div>
      </main>
    </div>
  );
}

