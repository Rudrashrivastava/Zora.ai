import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronDown, ArrowRight, Sparkles, LogOut, LayoutDashboard, X, Cpu, Globe, FileText, Zap, BookOpen, Layers, ShieldCheck, CheckCircle, Terminal, Database, Code, Award, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
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
  const [activeFeatureTab, setActiveFeatureTab] = useState("all");
  const user = useSelector((state) => state.auth.user);
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  // Lenis Smooth Scroll Initialization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Custom JS-controlled video fade loop using requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId;
    const fadeDuration = 0.5;

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

        {/* 4. HERO CONTENT WITH FRAMER-MOTION ANIMATIONS */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 relative z-10 max-w-7xl mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-general-sans font-normal leading-[1.02] tracking-[-0.024em] text-[80px] sm:text-[140px] md:text-[180px] lg:text-[220px] select-none"
          >
            <span className="text-[#f3f3f2]">Xora </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(to left, #6366f1, #a855f7, #fcd34d)",
              }}
            >
              AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-[#d3d2cf] text-lg sm:text-xl leading-8 max-w-md mt-[9px] font-light"
          >
            The most powerful AI ever deployed <br className="hidden sm:inline" /> in talent acquisition & RAG research
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(user ? "/chat" : "/register")}
            className="hero-secondary-btn px-[29px] py-[16px] sm:py-[20px] mt-[25px] rounded-full font-semibold text-base sm:text-lg text-white inline-flex items-center gap-3 cursor-pointer group shadow-2xl"
          >
            <Sparkles className="w-5 h-5 text-amber-300 transition-transform group-hover:rotate-12" />
            <span>{user ? "Launch Workspace" : "Get Started Free"}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </motion.button>
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
          ULTRA-RICH ANIMATED FRAMER-MOTION NAV MODALS
      ========================================================= */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-[#0a0e19]/95 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-white max-h-[90vh] overflow-y-auto my-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* =========================================================
                  MODAL 1: FEATURES (ULTRA-RICH TECHNICAL ARCHITECTURE)
              ========================================================= */}
              {activeModal === "features" && (
                <div>
                  <div className="flex items-center gap-3.5 mb-6 border-b border-white/10 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 text-purple-300 border border-purple-500/40 shadow-inner">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">Xora.ai Technical Architecture & Features</h2>
                        <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">Enterprise Grade</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">Built with 3-Tier Failover, Pre-Retrieval Vector RAG & Live Citation Synthesis</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Feature Card 1 */}
                    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4.5 hover:border-cyan-500/60 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
                          <Cpu className="w-4.5 h-4.5 text-cyan-400" /> 3-Tier Multi-LLM Failover Loop
                        </div>
                        <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">99.99% Uptime</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Automatic single-pass provider cascade: <code className="text-cyan-300 font-mono">Gemini 1.5 Flash</code> ➔ <code className="text-cyan-300 font-mono">Gemini 1.5 Pro</code> ➔ <code className="text-cyan-300 font-mono">Mistral AI</code>. Instantiates fresh SDK instances with <code className="text-amber-300 font-mono">maxRetries: 0</code> to bypass LangChain locks during Google API spikes.
                      </p>
                    </div>

                    {/* Feature Card 2 */}
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4.5 hover:border-purple-500/60 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-purple-300">
                          <Globe className="w-4.5 h-4.5 text-purple-400" /> Live Web Grounding & Citations
                        </div>
                        <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Tavily API</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Deterministic pre-retrieval fetches live internet data before model execution. Returns interactive source cards with domain metadata, snippets, and clean markdown citation links.
                      </p>
                    </div>

                    {/* Feature Card 3 */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4.5 hover:border-emerald-500/60 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                          <Database className="w-4.5 h-4.5 text-emerald-400" /> Compound Vector RAG Engine
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">B-Tree O(log N)</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Uploaded PDF & study notes are split into overlap chunks, embedded, and indexed with compound B-tree lookup (<code className="text-emerald-300 font-mono">&#123; user: 1, pinned: -1, updatedAt: -1 &#125;</code>) for instant zero-hallucination QA.
                      </p>
                    </div>

                    {/* Feature Card 4 */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4.5 hover:border-amber-500/60 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                          <FileText className="w-4.5 h-4.5 text-amber-400" /> 1-Click Printable PDF Exporter
                        </div>
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">PDFKit Engine</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Converts complex markdown AI answers into professionally formatted A4 engineering study notes with custom headers, page numbering, and clean typography ready for exam printing.
                      </p>
                    </div>

                    {/* Feature Card 5 */}
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4.5 hover:border-indigo-500/60 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
                          <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" /> Dual JWT & Refresh Rotation
                        </div>
                        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">SHA-256 Hash</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Short-lived HttpOnly Access tokens (15m) + Long-lived Refresh tokens (7d). Raw refresh tokens are never stored in DB—only SHA-256 hashes with automatic token reuse detection.
                      </p>
                    </div>

                    {/* Feature Card 6 */}
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4.5 hover:border-rose-500/60 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                          <Award className="w-4.5 h-4.5 text-rose-400" /> Automated RGPV Exam Generator
                        </div>
                        <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">Sem 1 - 8 CSE/IT</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Dedicated prompt persona automatically synthesizes Unit 1-5 concepts, key derivations, and high-probability 7-mark & 14-mark university exam questions with step-by-step solutions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  MODAL 2: SOLUTIONS (REAL-WORLD USE-CASES)
              ========================================================= */}
              {activeModal === "solutions" && (
                <div>
                  <div className="flex items-center gap-3.5 mb-6 border-b border-white/10 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-500/40 shadow-inner">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Tailored Engineering & Research Solutions</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Purpose-built for engineering exam prep, full-stack debugging & academic synthesis</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Solution 1 */}
                    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 text-xl font-bold">
                        🎓
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">RGPV & University Engineering Exam Prep</h4>
                          <span className="rounded-full bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-semibold border border-purple-500/30">High Success Rate</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          Generate complete Unit-wise concepts for Data Structures, Operating Systems, DBMS, Mathematics, and Computer Networks. Includes 7-mark short notes, 14-mark detailed derivations, and printable PDF export.
                        </p>
                      </div>
                    </div>

                    {/* Solution 2 */}
                    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 text-xl font-bold">
                        💻
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">Full-Stack Code Refactoring & Error Diagnosis</h4>
                          <span className="rounded-full bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-semibold border border-cyan-500/30">Developer Special</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          Paste complex stack traces, React lifecycle warnings, MongoDB cast errors, or SQL query performance bottlenecks. Receive step-by-step root-cause diagnostics and refactored code blocks.
                        </p>
                      </div>
                    </div>

                    {/* Solution 3 */}
                    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-xl font-bold">
                        🔬
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">Academic Paper & Technical Document QA</h4>
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/30">Vector Indexing</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          Upload 50+ page research papers or technical documentation. Extract formulas, compare experimental methodologies, and query specific sections without reading the entire document.
                        </p>
                      </div>
                    </div>

                    {/* Solution 4 */}
                    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 text-xl font-bold">
                        💼
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">Enterprise Knowledge Search & Team Synthesis</h4>
                          <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-semibold border border-amber-500/30">Instant Setup</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          Turn unstructured team notes, product specs, and internal wikis into a searchable AI knowledge assistant with zero training time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  MODAL 3: PLANS (PRICING & GATEWAY ROADMAP)
              ========================================================= */}
              {activeModal === "plans" && (
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-inner">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Scale seamlessly from individual learning to enterprise team search</p>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT GATEWAY NOTICE BANNER */}
                  <div className="mb-6 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4 flex items-center gap-3.5 text-amber-200 text-xs font-medium shadow-lg">
                    <Sparkles className="w-6 h-6 shrink-0 text-amber-400 animate-pulse" />
                    <div>
                      <div className="font-bold text-amber-300 text-sm">💳 Payment Gateway Integration (Stripe/Razorpay) Coming Soon!</div>
                      <div className="mt-0.5 text-amber-200/90">All Pro features are currently <strong>100% FREE & UNLIMITED</strong> for all early access users!</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Free Tier */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-zinc-400">Starter</div>
                        <div className="text-3xl font-extrabold mt-1 text-white">$0 <span className="text-xs font-normal text-zinc-400">/ forever</span></div>
                        <p className="text-[11px] text-zinc-400 mt-1">For casual search & quick study notes</p>
                        <ul className="mt-4 space-y-2 text-xs text-zinc-300">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 100 Search Queries / day</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 5 Document Uploads</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Standard Failover Cascade</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> PDF Study Notes Export</li>
                        </ul>
                      </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="rounded-2xl border-2 border-purple-500 bg-purple-950/30 p-5 flex flex-col justify-between relative overflow-hidden shadow-xl">
                      <div className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow">
                        Active Free Access
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-purple-300">Pro Engineer</div>
                        <div className="text-3xl font-extrabold mt-1 text-white">$19 <span className="text-xs font-normal text-zinc-400">/ month</span></div>
                        <p className="text-[11px] text-purple-200/80 mt-1">For students & full-stack developers</p>
                        <ul className="mt-4 space-y-2 text-xs text-zinc-200">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400 shrink-0" /> Unlimited Live Web Searches</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400 shrink-0" /> Unlimited Vector Document QA</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400 shrink-0" /> Priority Multi-Tier Model Access</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400 shrink-0" /> High-Resolution PDF Exports</li>
                        </ul>
                      </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-cyan-400">Enterprise</div>
                        <div className="text-3xl font-extrabold mt-1 text-white">Custom</div>
                        <p className="text-[11px] text-zinc-400 mt-1">For teams & organization knowledge bases</p>
                        <ul className="mt-4 space-y-2 text-xs text-zinc-300">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Dedicated Pinecone Vector Index</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Custom Model Fine-Tuning</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> 99.99% Guaranteed SLA Uptime</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Dedicated Technical Support</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs text-zinc-400">No credit card required for early access registration.</span>
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        navigate(user ? "/chat" : "/register");
                      }}
                      className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 text-black hover:opacity-90 transition cursor-pointer shadow-lg"
                    >
                      {user ? "Launch Workspace" : "Start Using For Free"} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================
                  MODAL 4: LEARNING & DOCS (DEVELOPER GUIDE & CHEATSHEET)
              ========================================================= */}
              {activeModal === "learning" && (
                <div>
                  <div className="flex items-center gap-3.5 mb-6 border-b border-white/10 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/40 shadow-inner">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Learning & Technical Documentation</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Master vector RAG, 3-tier failover & prompt engineering</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Guide 1 */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5">
                      <div className="flex items-center gap-2 font-bold text-sm text-cyan-400 mb-1.5">
                        <BookOpen className="w-4 h-4" /> 1. Vector RAG Document QA Walkthrough
                      </div>
                      <p className="text-zinc-300 leading-relaxed mb-2">
                        Upload any course document or research PDF by clicking the paperclip icon in the workspace chatbar.
                      </p>
                      <div className="rounded-xl bg-black/60 p-3 font-mono text-[11px] text-zinc-300 border border-white/5 space-y-1">
                        <div className="text-cyan-300">// Step 1: Attach RAG File (.pdf, .txt, .md)</div>
                        <div className="text-zinc-400">ingestFile() ➔ Chunks text (500 tokens) ➔ Generates embeddings</div>
                        <div className="text-purple-300">// Step 2: Query your workspace</div>
                        <div className="text-zinc-400">"Summarize Unit 3 Data Structures from uploaded notes"</div>
                      </div>
                    </div>

                    {/* Guide 2 */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5">
                      <div className="flex items-center gap-2 font-bold text-sm text-purple-400 mb-1.5">
                        <Cpu className="w-4 h-4" /> 2. 3-Tier Provider Failover Mechanism
                      </div>
                      <p className="text-zinc-300 leading-relaxed mb-2">
                        Xora.ai handles Google API rate limits (429) or capacity outages (503) using an isolated failover loop:
                      </p>
                      <div className="rounded-xl bg-black/60 p-3 font-mono text-[11px] text-zinc-300 border border-white/5 space-y-1">
                        <div>1. <span className="text-indigo-400">Gemini 1.5 Flash</span> (Primary — Fast execution)</div>
                        <div>2. <span className="text-purple-400">Gemini 1.5 Pro</span> (Fallback — High quality reasoning)</div>
                        <div>3. <span className="text-amber-400">Mistral AI (mistral-small-latest)</span> (Cloud Fallback — Independent provider)</div>
                      </div>
                    </div>

                    {/* Guide 3 */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-400 mb-1.5">
                        <Terminal className="w-4 h-4" /> 3. Prompt Engineering for Exam Notes
                      </div>
                      <p className="text-zinc-300 leading-relaxed mb-2">
                        Use structured prompts to get optimal RGPV university exam notes formatted with derivations:
                      </p>
                      <div className="rounded-xl bg-black/60 p-3 font-mono text-[11px] text-amber-300 border border-white/5">
                        "Generate RGPV semester notes for [Subject] Unit 2. Include key definitions, formulas, 7-mark short answers, and 14-mark derivations."
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
