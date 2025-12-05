import Link from "next/link";
import { ArrowLeft, BookOpen, Zap, Activity, Compass } from "lucide-react";

const quickStart = [
  {
    title: "Visit the app",
    items: [
      { label: "Landing", value: "https://ghost-green.vercel.app" },
      { label: "App", value: "https://ghost-green.vercel.app/app" },
    ],
  },
  {
    title: "Sign in",
    items: [
      { value: "Start as Guest instantly" },
      { value: "Link Google or Email to persist sessions and unlock upgrades" },
    ],
  },
  {
    title: "Run a session",
    items: [
      { value: "Pick a mode (Sales, Interview, Negotiation)" },
      { value: "Click START" },
      { value: "Keep Ghost visible (desktop HUD or mobile bottom sheet)" },
      { value: "Mention price / budget / competition / timeline to trigger cues" },
    ],
  },
  {
    title: "Review afterwards",
    items: [
      { value: "Open Session Replay for transcripts, cues, analytics" },
      { value: "Export CSV/PDF if plan allows" },
    ],
  },
];

const dashboard = [
  { area: "Floating HUD", description: "Live intel, focus mode, pinning, whisper control, hotkeys" },
  { area: "Live Intel Board", description: "Full list of cues with KB badge when RAG context is used" },
  { area: "Live Transcript", description: "Scrollable log of You vs Them speech" },
  { area: "Quick Actions (mobile)", description: "Bottom sheet with latest cue + Focus / Whisper toggles" },
  { area: "Analytics", description: "Usage stats, cue generation, feature usage (Founders+)" },
];

const workflows = [
  {
    title: "Running a Session",
    steps: [
      "Select a mode in the top bar",
      "Adjust parameters if needed",
      "Start the session (hotkey Ctrl+Shift+S)",
      "Mention key triggers to surface cues",
      "Use hotkeys to toggle focus, mute whispers, pin HUD",
    ],
  },
  {
    title: "Knowledge Base (RAG)",
    steps: [
      "Open Knowledge Base modal",
      "Upload text / markdown files (PDF support coming soon)",
      "Ghost chunk + embed + push to Pinecone",
      "KB-sourced cues show a green “KB” badge",
    ],
  },
  {
    title: "Custom Playbooks",
    steps: [
      "Create playbook with scenario + instruction prompt",
      "Add example cues for reference",
      "Select playbook to activate (persists per user)",
      "All coaching cues now follow that persona",
    ],
  },
  {
    title: "Session Replay & Export",
    steps: [
      "Open Session Replay modal",
      "Browse sessions (limited by plan)",
      "Review transcripts, cues, analytics",
      "Export CSV/PDF if entitlement allows",
    ],
  },
];

const hotkeys = [
  { action: "Toggle HUD", combo: "Ctrl + Shift + G" },
  { action: "Pin / Unpin HUD", combo: "Ctrl + Shift + H" },
  { action: "Next cue", combo: "Ctrl + Shift + I" },
  { action: "Open intel board", combo: "Ctrl + Shift + L" },
  { action: "Focus Mode", combo: "Ctrl + Shift + F" },
  { action: "Mute whispers", combo: "Ctrl + Shift + M" },
  { action: "Start / Stop session", combo: "Ctrl + Shift + S" },
];

const plans = [
  { name: "Free", price: "$0", notes: "Testing", kb: "3 docs", replay: "5 sessions", analytics: "Basic" },
  { name: "Starter", price: "$99/mo", notes: "Pros", kb: "10 docs", replay: "50 sessions", analytics: "Full" },
  {
    name: "Founders",
    price: "$299 once",
    notes: "Lifetime",
    kb: "20 docs",
    replay: "Unlimited",
    analytics: "Full",
  },
  {
    name: "Enterprise",
    price: "Custom",
    notes: "Teams",
    kb: "Unlimited",
    replay: "Unlimited",
    analytics: "Full + API/SAML",
  },
];

const tips = [
  "Use Focus Mode during objection-heavy moments",
  "Upload fresh KB docs (battle cards, pricing) before calls",
  "Monitor analytics after each session for cue patterns",
  "Record your “Inception Method” video for social proof",
  "Pair Ghost with headphones for whisper coaching",
  "Experiment with Playbooks for each persona / vertical",
];

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to docs
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.4em] uppercase text-blue-400">
            <BookOpen className="w-4 h-4" />
            Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">Ghost Protocol — User Guide</h1>
          <p className="text-lg text-gray-400">
            A 5-minute walkthrough of setup, workflows, and best practices so you can win your next negotiation.
          </p>
        </div>

        <section className="grid md:grid-cols-2 gap-6">
          {quickStart.map((step) => (
            <div key={step.title} className="border border-gray-800 rounded-2xl p-6 bg-gray-950 space-y-3">
              <h2 className="text-xl font-semibold">{step.title}</h2>
              <ul className="text-sm text-gray-400 space-y-1">
                {step.items.map((item, idx) => (
                  <li key={idx}>
                    {"label" in item ? (
                      <span className="font-mono text-gray-300">{item.label}: </span>
                    ) : null}
                    {item.value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="border border-gray-800 rounded-2xl p-6 bg-gray-950">
          <div className="flex items-center gap-2 mb-4 text-blue-300">
            <Activity className="w-5 h-5" />
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {dashboard.map((row) => (
              <div key={row.area} className="py-3 flex flex-col sm:flex-row sm:items-start sm:gap-6">
                <span className="w-48 font-semibold text-gray-200">{row.area}</span>
                <p className="text-gray-400 text-sm">{row.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-blue-300">
            <Compass className="w-5 h-5" />
            <h2 className="text-2xl font-semibold">Key Workflows</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {workflows.map((flow) => (
              <div key={flow.title} className="border border-gray-800 rounded-2xl p-6 bg-gray-950">
                <h3 className="text-xl font-semibold mb-3">{flow.title}</h3>
                <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
                  {flow.steps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-800 rounded-2xl p-6 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-4">Hotkeys</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {hotkeys.map((hk) => (
                <li key={hk.action} className="flex items-center justify-between gap-3">
                  <span>{hk.action}</span>
                  <span className="font-mono text-blue-300">{hk.combo}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-gray-800 rounded-2xl p-6 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-4">Plans & Entitlements</h2>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.name} className="border border-gray-800 rounded-xl p-4 bg-black/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.notes}</p>
                    </div>
                    <span className="text-blue-300 font-semibold">{plan.price}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-3">
                    <p>KB: {plan.kb}</p>
                    <p>Replay: {plan.replay}</p>
                    <p className="col-span-2">Analytics: {plan.analytics}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-gray-800 rounded-2xl p-6 bg-gray-950 space-y-4">
          <div className="flex items-center gap-2 text-blue-300">
            <Zap className="w-5 h-5" />
            <h2 className="text-2xl font-semibold">Best Practices</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-300">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-gray-800 rounded-2xl p-6 bg-gray-950 text-sm text-gray-300 space-y-2">
          <h2 className="text-xl font-semibold text-white">Support</h2>
          <p>Email: <a href="mailto:support@ghostprotocol.ai" className="text-blue-300">support@ghostprotocol.ai</a></p>
          <p>Sales / Enterprise: <a href="mailto:sales@ghostprotocol.ai" className="text-blue-300">sales@ghostprotocol.ai</a></p>
          <p>Docs worth bookmarking: LANDING_PAGE_SETUP.md, SAMPLE_PLAYBOOK.md, TESTING_RAG.md, QUICK_TEST_RAG.md</p>
        </section>
      </main>
    </div>
  );
}

