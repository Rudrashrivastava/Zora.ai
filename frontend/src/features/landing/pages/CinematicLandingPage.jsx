import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { X, ChevronRight, Layers, ShieldCheck, Zap, Cpu, Sparkles, Terminal } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4";

// Exact Stylized Angular S / Bolt Brand Mark SVG
const BrandMarkSVG = () => (
  <svg
    viewBox="0 0 31.5 48.5"
    className="w-[31.5px] h-[48.5px] shrink-0 transition-transform duration-300 hover:scale-105"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="brandBoltGrad" x1="8" y1="0" x2="34.1" y2="28.9" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9e9e9e" />
        <stop offset="28%" stopColor="#a6a6a6" />
        <stop offset="34%" stopColor="#a3a3a3" />
        <stop offset="40%" stopColor="#3a3a3a" />
        <stop offset="55%" stopColor="#414141" />
        <stop offset="60%" stopColor="#7a7a7a" />
        <stop offset="68%" stopColor="#8e8e8e" />
        <stop offset="80%" stopColor="#a9a9a9" />
        <stop offset="95%" stopColor="#c4c4c4" />
        <stop offset="100%" stopColor="#cccccc" />
      </linearGradient>
    </defs>
    <path
      d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z"
      fill="url(#brandBoltGrad)"
    />
    <rect x="0.5" y="18.5" width="9" height="10" fill="#fdfdfd" />
    <rect x="22" y="19.5" width="9.5" height="9.5" fill="#fdfdfd" />
  </svg>
);

// Partner SVG Icons (currentColor = --strip)
const LogoIpsum1 = () => (
  <svg viewBox="0 0 30 31" className="w-[30px] h-[31px] fill-current">
    <rect x="2" y="2" width="26" height="27" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <circle cx="19.5" cy="10.5" r="4.5" fill="currentColor" />
  </svg>
);

const LogoIpsum2 = () => (
  <svg viewBox="0 0 25 30" className="w-[24.5px] h-[30px] fill-current">
    <rect x="2" y="2" width="8" height="26" rx="2" fill="currentColor" />
    <circle cx="17" cy="15" r="7.5" fill="currentColor" />
  </svg>
);

const LogoIpsum3 = () => (
  <svg viewBox="0 0 28 28" className="w-[28px] h-[28px] stroke-current fill-none" strokeWidth="3">
    <circle cx="14" cy="14" r="11" />
    <path d="M14 3 C 20 8, 20 20, 14 25" />
    <path d="M14 3 C 8 8, 8 20, 14 25" />
  </svg>
);

const LogoIpsum4 = () => (
  <svg viewBox="0 0 28 25.5" className="w-[28.5px] h-[25.5px] fill-current">
    <path d="M2 18 Q 7 8, 14 14 T 26 10 L 26 24 L 2 24 Z" />
  </svg>
);

export const CinematicLandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'about' | 'features' | 'faq' | 'contact' | 'architecture'
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

    return () => lenis.destroy();
  }, []);

  const handleCtaClick = () => {
    if (user) {
      navigate("/chat");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-[#fafafa] overflow-hidden font-sans select-none antialiased text-rendering-geometric">
      {/* INLINE CSS FOR UNIT SYSTEM & FONT INJECTION */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');
        
        :root {
          --ink: #fafafa;
          --muted: #a7a6a6;
          --nav: #b6b5b5;
          --strip: #8b8a8a;
          --pill: #ffffff;
          --pill-ink: #050505;
          --stage-bg: #050505;
          
          --u: calc(100vh / 1058);
          --uw: calc(100vw / 1487);
          --h: clamp(var(--u), calc(var(--u) * .65 + var(--uw) * .35), calc(var(--u) * 1.16));
        }

        @supports (height: 100dvh) {
          :root { --u: calc(100dvh / 1058); }
        }

        body {
          font-family: 'Manrope', system-ui, -apple-system, sans-serif;
          background-color: #050505;
        }

        .ipsum-font {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* Desktop Video Geometry & Fade Overlays */
        .plate-video {
          position: absolute;
          left: 50%;
          top: calc(1 * var(--u));
          width: calc(1492 * var(--u));
          height: calc(1054 * var(--u));
          transform: translateX(calc(-50% - calc(0.5 * var(--u))));
          object-fit: cover;
          pointer-events: none;
        }

        .plate-overlay::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(to bottom,
              rgba(5,5,5,0) 78.8%, rgba(5,5,5,.23) 79.6%, rgba(5,5,5,.45) 81.4%,
              rgba(5,5,5,.75) 83.3%, rgba(5,5,5,.84) 85.2%, rgba(5,5,5,.888) 88%,
              rgba(5,5,5,.905) 91%, rgba(5,5,5,.96) 95%, #050505 100%),
            linear-gradient(to right,
              #050505 calc(50% - calc(746 * var(--u))),
              transparent calc(50% - calc(676 * var(--u))),
              transparent calc(50% + calc(676 * var(--u))),
              #050505 calc(50% + calc(746 * var(--u))));
        }

        @media (max-aspect-ratio: 11/10) {
          .plate-video {
            inset: 0;
            width: 100%;
            height: 100%;
            transform: none;
            left: 0;
            top: 0;
            object-fit: cover;
            object-position: 43% center;
          }
          .plate-overlay::after {
            background:
              linear-gradient(to right, rgba(5,5,5,.86) 0%, rgba(5,5,5,.66) 42%, rgba(5,5,5,.20) 78%, rgba(5,5,5,.10) 100%),
              linear-gradient(to bottom, rgba(5,5,5,.72) 0%, rgba(5,5,5,.34) 24%, rgba(5,5,5,.34) 56%, rgba(5,5,5,.80) 82%, rgba(5,5,5,.97) 94%, #050505 100%);
          }
        }
      `}</style>

      {/* 1. CLOUDFRONT VIDEO BACKGROUND PLANE */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 plate-overlay">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="plate-video"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </div>

      {/* 2. STAGE / CONTENT LAYOUT */}
      <div className="relative z-10 min-h-screen w-full flex flex-col justify-between p-0 overflow-hidden">
        
        {/* HEADER / TOPBAR */}
        <header className="w-full relative z-30">
          <div className="max-w-[1487px] mx-auto w-full flex items-center justify-between px-[75px] pt-[27px]">
            
            {/* Brand Logo (Hero Left Signal) */}
            <Link to="/" aria-label="Home" className="flex items-center">
              <BrandMarkSVG />
            </Link>

            {/* Nav Links (Centered Desktop) */}
            <nav className="hidden md:flex items-center gap-[25px] text-[#b6b5b5] text-[19px] font-normal tracking-tight">
              <button
                onClick={() => setActiveModal("about")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                About
              </button>
              <button
                onClick={() => setActiveModal("features")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => setActiveModal("faq")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                FAQ
              </button>
              <button
                onClick={() => setActiveModal("contact")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contact
              </button>
            </nav>

            {/* Header CTA Pill */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={handleCtaClick}
                    className="h-[49px] px-6 rounded-full bg-white text-[#050505] text-[20px] font-medium transition-transform duration-200 hover:scale-105 cursor-pointer flex items-center justify-center shadow-lg"
                  >
                    <span>Workspace</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-[#a7a6a6] hover:text-white transition-colors px-3 py-2 cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCtaClick}
                  className="h-[49px] w-[175px] rounded-full bg-white text-[#050505] text-[20px] font-medium transition-transform duration-200 hover:scale-105 cursor-pointer flex items-center justify-center shadow-lg"
                >
                  <span className="translate-y-[1px]">Get Started</span>
                </button>
              )}
            </div>

            {/* Mobile Burger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-md cursor-pointer"
              aria-label="Toggle Menu"
            >
              <div className="w-5 h-[2px] bg-white transition-all mb-1" />
              <div className="w-5 h-[2px] bg-white transition-all" />
            </button>
          </div>
        </header>

        {/* HERO CONTENT */}
        <main className="flex-1 flex flex-col justify-center px-[75px] pt-[80px] pb-[100px] relative z-20 max-w-[1487px] mx-auto w-full">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
            className="text-[#fafafa] text-[54px] sm:text-[71.6px] font-normal leading-[1.12] tracking-[0.003em] whitespace-pre-line"
          >
            <span className="block">The Next Layer</span>
            <span className="block">of Intelligence</span>
          </motion.h1>

          {/* Subcopy */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
            className="text-[#a7a6a6] text-[18px] sm:text-[20.7px] font-normal leading-[1.25] tracking-normal max-w-xl mt-6 whitespace-pre-line"
          >
            <span className="block">A unified infrastructure platform to help teams build,</span>
            <span className="block">ship, and scale AI systems with confidence.</span>
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
            className="flex items-center gap-8 mt-10"
          >
            <button
              onClick={handleCtaClick}
              className="h-[50px] px-8 rounded-full bg-white text-[#050505] text-[20.6px] font-medium transition-transform duration-200 hover:scale-105 cursor-pointer shadow-xl flex items-center justify-center"
            >
              <span>{user ? "Launch Workspace" : "Get Started"}</span>
            </button>

            <button
              onClick={() => setActiveModal("architecture")}
              className="text-white text-[20.6px] font-medium tracking-[0.012em] hover:text-white/80 transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              View Architecture <ChevronRight className="w-5 h-5 opacity-70" />
            </button>
          </motion.div>
        </main>

        {/* FOOTER PARTNER LOGOS STRIP */}
        <footer className="w-full pb-10 relative z-20">
          <div className="max-w-[1487px] mx-auto w-full px-[75px] flex flex-wrap items-center justify-between text-[#8b8a8a] gap-8">
            {/* Logo 1 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.34 }}
              className="flex items-center gap-3.5 group cursor-pointer"
            >
              <LogoIpsum1 />
              <span className="ipsum-font text-[18.1px] text-[#8b8a8a] group-hover:text-white transition-colors">
                logoipsum
              </span>
            </motion.div>

            {/* Logo 2 (with dot) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.40 }}
              className="flex items-center gap-3.5 group cursor-pointer"
            >
              <LogoIpsum2 />
              <span className="ipsum-font text-[18.5px] text-[#8b8a8a] group-hover:text-white transition-colors flex items-baseline">
                logoipsum<span className="w-1.5 h-1.5 rounded-full bg-[#8b8a8a] group-hover:bg-white inline-block ml-1" />
              </span>
            </motion.div>

            {/* Logo 3 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.46 }}
              className="flex items-center gap-3.5 group cursor-pointer"
            >
              <LogoIpsum3 />
              <span className="ipsum-font text-[16.15px] text-[#8b8a8a] group-hover:text-white transition-colors">
                logoipsum
              </span>
            </motion.div>

            {/* Logo 4 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.52 }}
              className="flex items-center gap-3.5 group cursor-pointer"
            >
              <LogoIpsum4 />
              <span className="ipsum-font text-[15.3px] text-[#8b8a8a] group-hover:text-white transition-colors">
                logoipsum
              </span>
            </motion.div>
          </div>
        </footer>
      </div>

      {/* MOBILE OVERLAY MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-2xl flex flex-col justify-between p-8"
          >
            <div className="flex items-center justify-between">
              <BrandMarkSVG />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-white/10 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-6 my-auto">
              <span className="text-xs uppercase tracking-widest text-[#a7a6a6]">Menu</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("about");
                }}
                className="text-3xl font-medium text-left text-white hover:text-white/80"
              >
                About
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("features");
                }}
                className="text-3xl font-medium text-left text-white hover:text-white/80"
              >
                Features
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("faq");
                }}
                className="text-3xl font-medium text-left text-white hover:text-white/80"
              >
                FAQ
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("contact");
                }}
                className="text-3xl font-medium text-left text-white hover:text-white/80"
              >
                Contact
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleCtaClick}
                className="w-full py-4 rounded-full bg-white text-[#050505] text-lg font-semibold"
              >
                Get Started
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("architecture");
                }}
                className="w-full py-4 rounded-full border border-white/20 text-white text-lg font-semibold"
              >
                View Architecture
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RICH INTERACTIVE MODALS */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-[#0a0a0a] p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {activeModal === "about" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
                    <Sparkles className="w-6 h-6 text-amber-300" /> About The Next Layer of Intelligence
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Designed as an enterprise AI-infrastructure stage, this platform combines multi-provider model failover, live Tavily web grounding, and compound vector RAG into a single unified API pipeline.
                  </p>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 space-y-2">
                    <div>// Core Architecture</div>
                    <div>• 3-Tier Multi-Provider Cascade (Gemini 3.6 Flash ➔ Flash Lite ➔ Mistral)</div>
                    <div>• Single-Pass Deterministic Context Pre-Retrieval</div>
                    <div>• Dual JWT Auth & Refresh Rotation with Reuse Wipe</div>
                  </div>
                </div>
              )}

              {activeModal === "features" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
                    <Zap className="w-6 h-6 text-purple-400" /> Infrastructure Features
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="font-bold text-white mb-1">⚡ 3-Tier AI Cascade</div>
                      <div className="text-zinc-400">Zero downtime failover across Google & Mistral endpoints.</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="font-bold text-white mb-1">📄 Vision OCR Fallback</div>
                      <div className="text-zinc-400">Automatic scanner detection for handwritten PDFs.</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="font-bold text-white mb-1">🔍 Live Web Grounding</div>
                      <div className="text-zinc-400">Interactive citation cards powered by Tavily REST API.</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                      <div className="font-bold text-white mb-1">🖨️ PDFKit Notes Export</div>
                      <div className="text-zinc-400">1-click printable A4 university exam study notes.</div>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "faq" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
                    <ShieldCheck className="w-6 h-6 text-cyan-400" /> Frequently Asked Questions
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                      <div className="font-bold text-white mb-1">Q: How does zero-hallucination work?</div>
                      <div className="text-zinc-400">We pre-retrieve document chunks before LLM execution, forcing deterministic single-pass synthesis.</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                      <div className="font-bold text-white mb-1">Q: What happens if an AI provider API is down?</div>
                      <div className="text-zinc-400">Our 3-tier failover loop automatically cascades to the next available provider with maxRetries: 0.</div>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "contact" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
                    <Terminal className="w-6 h-6 text-emerald-400" /> Developer Contact & Support
                  </div>
                  <p className="text-xs text-zinc-300">Reach out to our engineering team for custom enterprise AI deployments.</p>
                  <div className="p-4 rounded-2xl border border-white/10 bg-black/60 font-mono text-xs text-cyan-300">
                    Email: support@xora.ai <br />
                    Docs: https://xora-ai.onrender.com/docs
                  </div>
                </div>
              )}

              {activeModal === "architecture" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
                    <Cpu className="w-6 h-6 text-amber-400" /> Technical Architecture Blueprint
                  </div>
                  <div className="p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto">
                    <div className="text-amber-300">// 1. Pre-Retrieval RAG Phase</div>
                    <div>Vector Search (Pinecone/Mongo) ➔ Tavily Web Grounding</div>
                    <div className="text-purple-300">// 2. Single-Pass Prompt Injection</div>
                    <div>System Prompt Synthesis (LaTeX math + Markdown rules)</div>
                    <div className="text-cyan-300">// 3. Multi-Provider LLM Cascade</div>
                    <div>Gemini 3.6 Flash ➔ Gemini 3.5 Flash Lite ➔ Mistral AI</div>
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

export default CinematicLandingPage;
