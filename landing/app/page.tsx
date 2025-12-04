import { Shield, Zap, Mic, BookOpen, Check, ArrowRight, Play, DollarSign, Clock, Globe, Download, Monitor, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold">GHOST</span>
              <span className="text-gray-600 font-light">PROTOCOL</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#download"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Download
              </a>
              <a
                href="#pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a
                href="/app"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Launch App
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-400 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>Real-Time AI Negotiation Wingman</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Never freeze in a negotiation again
          </h1>
            <p className="text-xl sm:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Ghost whispers real-time coaching cues in your ear during sales calls, interviews, and high-stakes conversations. Undetectable. Sub-500ms latency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#download"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-lg font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Desktop App
              </a>
              <a
                href="/app"
                className="px-8 py-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-lg text-lg font-semibold transition-all flex items-center gap-2"
              >
                Use Web Version
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-6">Desktop app includes floating HUD overlay • Web version works on any device</p>
          </div>
        </div>
      </section>

      {/* Demo Video Section - The "Inception Method" */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">See Ghost in Action</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Watch how Ghost helped save $400 on a Comcast bill negotiation. Real-time coaching cues appear on screen as the conversation unfolds.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center">
              {/* Placeholder for video - replace with actual video embed */}
              <div className="text-center">
                <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Demo video coming soon</p>
                <p className="text-sm text-gray-600 mt-2">Record your &quot;Inception Method&quot; video here</p>
              </div>
              {/* When ready, replace with:
              <iframe
                className="w-full h-full rounded-xl"
                src="YOUR_VIDEO_URL"
                title="Ghost Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Sales Reps Love Ghost</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The only AI coach that works in real-time during live conversations
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sub-500ms Latency</h3>
              <p className="text-gray-400">
                Coaching cues appear instantly as conversations unfold. No delay, no missed opportunities.
              </p>
            </div>
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Undetectable</h3>
              <p className="text-gray-400">
                Silent coaching via visual cues and optional whispers. Your customer never knows Ghost is helping.
              </p>
            </div>
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Knowledge Base RAG</h3>
              <p className="text-gray-400">
                Upload your product docs, pricing sheets, and battle cards. Ghost uses them to give context-aware coaching.
              </p>
            </div>
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Playbooks</h3>
              <p className="text-gray-400">
                Create scenario-specific coaching prompts. Sales, interviews, negotiations—Ghost adapts to your use case.
              </p>
            </div>
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Session Replay</h3>
              <p className="text-gray-400">
                Review every conversation, every coaching cue, every outcome. Learn from your wins and losses.
              </p>
            </div>
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Works on Any Platform</h3>
              <p className="text-gray-400">
                Desktop app with floating HUD for Zoom/Meet/Teams, or use the web version in any browser. Choose what works for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section - Desktop App with Floating HUD */}
      <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-950/30 to-gray-950 border-y border-blue-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-400 text-sm mb-6">
              <Monitor className="w-4 h-4" />
              <span>Desktop App Available</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Download Ghost Desktop App</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Get the full experience with a floating HUD that overlays Zoom, Meet, and Teams during your calls
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Floating HUD Overlay</h3>
                  <p className="text-gray-400 mb-4">
                    The desktop app includes a floating HUD window that stays on top of all applications, including Zoom, Google Meet, and Microsoft Teams. Coaching cues appear in real-time without switching windows.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400" />
                      <span>Floats over video calls (Zoom, Meet, Teams)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400" />
                      <span>Draggable and resizable</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400" />
                      <span>Adjustable opacity</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400" />
                      <span>Works in fullscreen mode</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* macOS Download */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍎</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">macOS</h3>
                    <p className="text-xs text-gray-500">Apple Silicon & Intel</p>
                  </div>
                </div>
                <a
                  href="https://github.com/vince13/ghost-download/releases/download/v0.1.1/Ghost%20Protocol-0.1.1-arm64.dmg"
                  className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-center font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download DMG
                </a>
                <a
                  href="https://github.com/vince13/ghost-download/releases/download/v0.1.1/Ghost%20Protocol-0.1.1-arm64-mac.zip"
                  className="block w-full mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-center text-sm transition-colors"
                >
                  Download ZIP
                </a>
              </div>

              {/* Windows Download */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🪟</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Windows</h3>
                    <p className="text-xs text-gray-500">10 & 11</p>
                  </div>
                </div>
                <a
                  href="https://github.com/vince13/ghost-download/releases/download/v0.1.1/Ghost%20Protocol%20Setup%200.1.1.exe"
                  className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-center font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Installer
                </a>
                <a
                  href="https://github.com/vince13/ghost-download/releases/download/v0.1.1/Ghost%20Protocol%200.1.1.exe"
                  className="block w-full mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-center text-sm transition-colors"
                >
                  Download Portable
                </a>
              </div>

              {/* Linux Download */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🐧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Linux</h3>
                    <p className="text-xs text-gray-500">AppImage & Debian</p>
                  </div>
                </div>
                <a
                  href="https://github.com/vince13/ghost-download/releases/download/v0.1.0/ghost-0.1.0.AppImage"
                  className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-center font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download AppImage
                </a>
                <a
                  href="https://github.com/vince13/ghost-download/releases/download/v0.1.0/ghost-protocol_0.1.0_amd64.deb"
                  className="block w-full mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-center text-sm transition-colors"
                >
                  Download DEB
                </a>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Prefer to use in your browser? <a href="/app" className="text-blue-400 hover:text-blue-300 underline">Use the web version</a>
              </p>
              <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop: Floating HUD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile: Web version</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for High-Stakes Conversations</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Whether you&apos;re closing deals, acing interviews, or negotiating contracts
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-blue-900/20 to-gray-900 rounded-xl border border-blue-800/30">
              <DollarSign className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Sales Calls</h3>
              <p className="text-gray-400 mb-4">
                Handle price objections, competitor mentions, and timeline concerns with real-time coaching.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>ROI-focused responses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>TCO calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Competitive differentiation</span>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-gradient-to-br from-purple-900/20 to-gray-900 rounded-xl border border-purple-800/30">
              <Shield className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Job Interviews</h3>
              <p className="text-gray-400 mb-4">
                Answer behavioral questions, technical challenges, and salary negotiations with confidence.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>STAR method coaching</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>Technical problem structure</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>Salary negotiation tactics</span>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-gradient-to-br from-pink-900/20 to-gray-900 rounded-xl border border-pink-800/30">
              <Zap className="w-8 h-8 text-pink-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Any Negotiation</h3>
              <p className="text-gray-400 mb-4">
                Contracts, partnerships, vendor deals—Ghost helps you navigate any high-stakes conversation.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400" />
                  <span>Value-first positioning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400" />
                  <span>Win-win frameworks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400" />
                  <span>Emotional intelligence cues</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free. Upgrade when you&apos;re ready to scale.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-full">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="text-3xl font-bold mb-4">$0</div>
              <p className="text-sm text-gray-400 mb-6">Perfect for testing</p>
              <ul className="space-y-3 mb-6 text-sm flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>5 session replays</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>5 KB knowledge base storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Analytics dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>TTS whispers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Session export</span>
                </li>
              </ul>
              <a
                href="/app"
                className="block w-full text-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Get Started
              </a>
            </div>

            {/* Starter Plan */}
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-full">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-4">$99<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-sm text-gray-400 mb-6">For professionals</p>
              <ul className="space-y-3 mb-6 text-sm flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>5 MB knowledge base storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>50 session replays per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Email support</span>
                </li>
              </ul>
              <a
                href="/app?checkout=starter"
                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Upgrade
              </a>
            </div>

            {/* Founders Club - Highlighted */}
            <div className="p-6 bg-gradient-to-br from-blue-900/30 to-gray-900 rounded-xl border-2 border-blue-500 relative flex flex-col h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                BEST VALUE
              </div>
              <h3 className="text-xl font-semibold mb-2">Founders Club</h3>
              <div className="text-3xl font-bold mb-4">$299<span className="text-lg text-gray-400"> once</span></div>
              <p className="text-sm text-gray-400 mb-6">Lifetime access</p>
              <ul className="space-y-3 mb-6 text-sm flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>10 MB knowledge base storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Unlimited session replays</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Lifetime access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Concierge onboarding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Founders Club badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>No recurring fees</span>
                </li>
              </ul>
              <a
                href="/app?checkout=founders"
                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold"
              >
                Join Founders Club
              </a>
            </div>

            {/* Enterprise */}
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-full">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <div className="text-3xl font-bold mb-4">Custom</div>
              <p className="text-sm text-gray-400 mb-6">For teams</p>
              <ul className="space-y-3 mb-6 text-sm flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Unlimited everything</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>SAML/SCIM</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Dedicated support</span>
                </li>
              </ul>
              <a
                href="mailto:sales@ghostprotocol.ai"
                className="block w-full text-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-y border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to never freeze again?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join sales reps, job seekers, and negotiators who use Ghost to win more conversations.
          </p>
          <a
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-lg font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-sm text-gray-500 mt-4">No credit card required • Setup in 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold">GHOST PROTOCOL</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="mailto:support@ghostprotocol.ai" className="hover:text-white transition-colors">Support</a>
              <a href="/app" className="hover:text-white transition-colors">App</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2024 Ghost Protocol. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
