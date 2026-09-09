import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronDown, ArrowRight, Sparkles, LogOut, LayoutDashboard, X, Cpu, Globe, FileText, Zap, BookOpen, Layers, ShieldCheck, CheckCircle } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4";

// Real technology infrastructure badges for marquee
const TECH_STACK = [
  { name: "Gemini 1.5 Flash", tag: "Google AI", gradient: "from-indigo-400 to-purple-500", icon: "⚡" },
  { name: "Mistral AI", tag: "Cloud LLM", gradient: "from-orange-400 to-pink-500", icon: "🧠" },
  { name: "Vector RAG", tag: "Pinecone DB", gradient: "from-emerald-400 to-teal-500", icon: "📄" },
  { name: "Tavily Search", tag: "Live Web", gradient: "from-cyan-400 to-blue-500", icon: "🔍" },
  { name: "Node.js Engine", tag: "Backend", gradient: "from-green-400 to-emerald-600", icon: "🚀" },
  { name: "React & Tailwind", tag: "Frontend", gradient: "from-violet-400 to-fuchsia-500", icon: "💎" },
];

const XoraLogo = ({ size = 32 }) => (
  <div className="flex items-center gap-2.5 cursor-pointer group">
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="transition-transform duration-300 group-hover:scale-105">
        <defs>
          <linearGradient id="landingLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#landingLogoGrad)" fillOpacity="0.15" stroke="url(#landingLogoGrad)" strokeWidth="1.5" />
        <path d="M12 12L28 28M28 12L12 28" stroke="url(#landingLogoGrad)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="20" r="4" fill="#a855f7" />
      </svg>
    </div>
    <span className="font-general-sans text-xl font-bold tracking-tight text-[#f3f3f2] group-hover:text-white transition-colors">
      Xora<span className="text-[#a855f7]">.ai</span>
    </span>
  </div>
);

const LandingPage = () => {
  const videoRef = useRef(null);
  const [videoOpacity, setVideoOpacity] = useState(0);
  const [activeModal, setActiveModal] = useState(null); // 'features' | 'solutions' | 'plans' | 'learning'
  const user = useSelector((state) => state.auth.user);
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  // Custom JS-controlled video fade loop using requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId;
    const fadeDuration = 0.5; // 0.5s fade-in at start, 0.5s fade-out at end

    const updateFade = () => {
      if (!video || video.paused) return;

      const currentTime = video.currentTime;
      const duration = video.duration || 0;
      let opacity = 1;

      if (currentTime < fadeDuration) {
        opacity = currentTime / fadeDuration;
      } else if (duration > 0 && duration - currentTime < fadeDuration) {
        opacity = Math.max(0, (duration - currentTime) / fadeDuration);
      } else {
        opacity = 1;
      }

      setVideoOpacity(opacity);
      animationFrameId = requestAnimationFrame(updateFade);
    };

    const handleEnded = () => {
      setVideoOpacity(0);
      cancelAnimationFrame(animationFrameId);
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => {});
          animationFrameId = requestAnimationFrame(updateFade);
        }
      }, 100);
    };

    const handlePlay = () => {
      animationFrameId = requestAnimationFrame(updateFade);
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);

    video.play().catch((err) => {
      console.warn("Autoplay interrupted:", err.message);
    });

    return () => {
      video?.removeEventListener("ended", handleEnded);
      video?.removeEventListener("play", handlePlay);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#05020d] text-[#f3f3f2] flex flex-col overflow-hidden font-sans">
      {/* 1. BACKGROUND VIDEO */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75"
          style={{ opacity: videoOpacity }}
        />
      </div>

      {/* 2. BLURRED OVERLAY SHAPE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none z-0 overflow-visible" />

      {/* HERO SECTION CONTAINER */}
      <div className="relative z-10 flex flex-col min-h-screen w-full overflow-visible">
        {/* 3. NAVBAR */}
        <header className="w-full relative z-20">
          <nav className="full-width py-5 px-6 sm:px-8 flex flex-row items-center justify-between">
            {/* Left: Logo */}
            <Link to="/">
              <XoraLogo size={32} />
            </Link>

            {/* Center: Interactive Nav Items */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => setActiveModal("features")}
                className="flex items-center gap-1.5 text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer"
              >
                Features <ChevronDown className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => setActiveModal("solutions")}
                className="text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer"
              >
                Solutions
              </button>

              <button
                onClick={() => setActiveModal("plans")}
                className="text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer"
              >
                Plans
              </button>

              <button
                onClick={() => setActiveModal("learning")}
                className="flex items-center gap-1.5 text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer"
              >
                Learning <ChevronDown className="w-4 h-4 opacity-70" />
              </button>
            </div>

            {/* Right: Auth Buttons */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/chat"
                    className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 text-black hover:opacity-90 transition-all duration-300 shadow-lg shadow-purple-500/20"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Workspace
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-[#f3f3f2]/70 hover:text-white transition-colors py-2 px-3 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors px-3 py-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="hero-secondary-btn rounded-full px-5 py-2 text-sm font-medium text-white"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* 1px divider line */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#f3f3f2]/20 to-transparent mt-[3px]" />
        </header>

        {/* 4. HERO CONTENT */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 relative z-10 max-w-7xl mx-auto w-full">
          <h1 className="font-general-sans font-normal leading-[1.02] tracking-[-0.024em] text-[80px] sm:text-[140px] md:text-[180px] lg:text-[220px] select-none">
            <span className="text-[#f3f3f2]">Xora </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(to left, #6366f1, #a855f7, #fcd34d)",
              }}
            >
              AI
            </span>
          </h1>

          <p className="text-[#d3d2cf] text-lg sm:text-xl leading-8 max-w-md mt-[9px] opacity-80 font-light">
            The most powerful AI ever deployed <br className="hidden sm:inline" /> in talent acquisition & RAG research
          </p>

          <button
            onClick={() => navigate(user ? "/chat" : "/register")}
            className="hero-secondary-btn px-[29px] py-[16px] sm:py-[20px] mt-[25px] rounded-full font-semibold text-base sm:text-lg text-white inline-flex items-center gap-3 cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-amber-300 transition-transform group-hover:rotate-12" />
            <span>{user ? "Launch Workspace" : "Get Started Free"}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </main>

        {/* 5. TECH INFRASTRUCTURE MARQUEE */}
        <footer className="w-full pb-10 pt-6 relative z-10 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="text-[#f3f3f2]/60 text-xs sm:text-sm max-w-[150px] text-center sm:text-left leading-snug font-medium">
              Driven by World-Class AI Models & RAG Infrastructure
            </div>

            <div className="overflow-hidden w-full sm:max-w-[700px] relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#05020d] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#05020d] to-transparent z-10 pointer-events-none" />

              <div className="animate-marquee flex items-center gap-10">
                {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 shrink-0 group cursor-pointer">
                    <div className="liquid-glass w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                      <span>{item.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#f3f3f2] group-hover:text-white transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* =========================================================
          INTERACTIVE NAV MODALS (Features, Solutions, Plans, Learning)
      ========================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0e121e]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white">
            {/* Close Button */}
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* MODAL 1: FEATURES */}
            {activeModal === "features" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Xora.ai Core Features</h2>
                    <p className="text-xs text-zinc-400">Enterprise AI Search & Knowledge Engine</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm text-cyan-400 mb-1">
                      <Cpu className="w-4 h-4" /> 3-Tier Multi-LLM Failover
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Automatic cascade loop across Gemini 1.5 Flash, Gemini Pro, and Mistral AI ensures 99.99% uptime with 0ms downtime.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm text-purple-400 mb-1">
                      <Globe className="w-4 h-4" /> Real-Time Web Synthesis
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Live internet search via Tavily API with clickable source cards and verified citations for every answer.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm text-emerald-400 mb-1">
                      <Layers className="w-4 h-4" /> Vector RAG Document QA
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Upload PDFs or study notes to ask complex questions over custom B-tree vector embeddings.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm text-amber-400 mb-1">
                      <FileText className="w-4 h-4" /> Printable PDF Notes
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      1-click instant export of AI answers into cleanly formatted PDF study notes ready for exam printing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 2: SOLUTIONS */}
            {activeModal === "solutions" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Tailored Solutions</h2>
                    <p className="text-xs text-zinc-400">Purpose-built for engineering, research & exam prep</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                    <span className="text-xl">🎓</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">RGPV & University Engineering Exam Prep</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Generate Unit-wise concepts (Sem 1 to 8, CSE/IT/ECE/ME), key formulas, and high-probability 7-mark & 14-mark question answers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                    <span className="text-xl">💻</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Software & Algorithm Debugging</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Deep code structural analysis, stack trace diagnosis, and architectural refactoring for developers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                    <span className="text-xl">🔬</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Academic & Technical Paper QA</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Upload research papers to extract key equations, methodologies, and comparisons instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 3: PLANS */}
            {activeModal === "plans" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Xora.ai Plans</h2>
                      <p className="text-xs text-zinc-400">Simple, transparent pricing for everyone</p>
                    </div>
                  </div>
                </div>

                {/* PAYMENT GATEWAY NOTICE */}
                <div className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-center gap-3 text-amber-300 text-xs font-medium">
                  <Sparkles className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
                  <span>
                    <strong>Payment Gateway Integration Coming Soon!</strong> All Pro features are currently <strong>100% FREE</strong> for all users.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Free Tier</div>
                      <div className="text-2xl font-bold mt-1 text-white">$0 <span className="text-xs font-normal text-zinc-400">/ forever</span></div>
                      <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                        <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 100 Search Queries / day</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 5 Document Uploads</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Standard Failover Pipeline</li>
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-500/50 bg-purple-500/10 p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-2 right-2 rounded-full bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Active
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-purple-300">Pro Engineer</div>
                      <div className="text-2xl font-bold mt-1 text-white">$19 <span className="text-xs font-normal text-zinc-400">/ month</span></div>
                      <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                        <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Unlimited Live Web Searches</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Unlimited Vector Document QA</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Priority Multi-Tier Model Access</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      navigate(user ? "/chat" : "/register");
                    }}
                    className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 text-black hover:opacity-90 transition cursor-pointer"
                  >
                    {user ? "Go to Workspace" : "Start Using For Free"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 4: LEARNING */}
            {activeModal === "learning" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Learning & Documentation</h2>
                    <p className="text-xs text-zinc-400">Master search, vector RAG & prompt engineering</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <h4 className="font-semibold text-sm text-cyan-400">📖 RAG Document QA Guide</h4>
                    <p className="text-zinc-300 mt-1 leading-relaxed">
                      Click the paperclip icon in the workspace chatbar to upload any PDF or TXT document. Xora.ai will chunk, index, and retrieve relevant snippets automatically.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <h4 className="font-semibold text-sm text-purple-400">⚡ 3-Tier Multi-Provider Failover Explained</h4>
                    <p className="text-zinc-300 mt-1 leading-relaxed">
                      Xora.ai maintains a live cascade of LLM providers. If Gemini 1.5 Flash is throttled or 503 unavailable, the system automatically redirects your query to Gemini 1.5 Pro or Mistral AI seamlessly.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <h4 className="font-semibold text-sm text-emerald-400">💡 Prompting Tips for High Precision</h4>
                    <p className="text-zinc-300 mt-1 leading-relaxed">
                      For engineering exam notes, type e.g. <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">"Generate RGPV Unit 3 notes for Data Structures with 7-mark questions"</code> to trigger automated structured note generation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
