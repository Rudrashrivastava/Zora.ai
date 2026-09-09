import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ChevronDown, ArrowRight, Sparkles, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4";

// Brand logos for marquee
const LOGOS = [
  { name: "Vortex", letter: "V", gradient: "from-indigo-500 to-purple-600" },
  { name: "Nimbus", letter: "N", gradient: "from-purple-500 to-pink-600" },
  { name: "Prysma", letter: "P", gradient: "from-amber-400 to-orange-500" },
  { name: "Cirrus", letter: "C", gradient: "from-cyan-400 to-blue-600" },
  { name: "Kynder", letter: "K", gradient: "from-emerald-400 to-teal-600" },
  { name: "Halcyn", letter: "H", gradient: "from-violet-500 to-fuchsia-600" },
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
        // Fade-in at start
        opacity = currentTime / fadeDuration;
      } else if (duration > 0 && duration - currentTime < fadeDuration) {
        // Fade-out at end
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
      {/* 1. BACKGROUND VIDEO (Wrapper div with overflow-hidden, no gradient overlay) */}
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

      {/* 2. BLURRED OVERLAY SHAPE (Centered behind content: w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px]) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none z-0 overflow-visible" />

      {/* HERO SECTION CONTAINER (overflow-visible so blur is not clipped) */}
      <div className="relative z-10 flex flex-col min-h-screen w-full overflow-visible">
        {/* 3. NAVBAR */}
        <header className="w-full relative z-20">
          <nav className="full-width py-5 px-6 sm:px-8 flex flex-row items-center justify-between">
            {/* Left: Logo */}
            <Link to="/">
              <XoraLogo size={32} />
            </Link>

            {/* Center: Nav Items */}
            <div className="hidden md:flex items-center gap-8">
              <button className="flex items-center gap-1.5 text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer">
                Features <ChevronDown className="w-4 h-4 opacity-70" />
              </button>
              <button className="text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer">
                Solutions
              </button>
              <button className="text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer">
                Plans
              </button>
              <button className="flex items-center gap-1.5 text-sm font-medium text-[#f3f3f2]/90 hover:text-white transition-colors cursor-pointer">
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
                    className="flex items-center gap-1.5 text-sm text-[#f3f3f2]/70 hover:text-white transition-colors py-2 px-3"
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

          {/* Below navbar: 1px divider line with gradient from-transparent via-foreground/20 to-transparent, offset mt-[3px] */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#f3f3f2]/20 to-transparent mt-[3px]" />
        </header>

        {/* 4. HERO CONTENT (Vertically centered via flex-1) */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 relative z-10 max-w-7xl mx-auto w-full">
          {/* Headline: "Power AI" */}
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

          {/* Subtitle: "The most powerful AI ever deployed / in talent acquisition" */}
          <p className="text-[#d3d2cf] text-lg sm:text-xl leading-8 max-w-md mt-[9px] opacity-80 font-light">
            The most powerful AI ever deployed <br className="hidden sm:inline" /> in talent acquisition
          </p>

          {/* CTA Button: "Schedule a Consult" */}
          <button
            onClick={() => navigate(user ? "/chat" : "/register")}
            className="hero-secondary-btn px-[29px] py-[16px] sm:py-[20px] mt-[25px] rounded-full font-semibold text-base sm:text-lg text-white inline-flex items-center gap-3 cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-amber-300 transition-transform group-hover:rotate-12" />
            <span>{user ? "Launch Workspace" : "Schedule a Consult"}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </main>

        {/* 5. LOGO MARQUEE (Pinned to bottom of hero, pb-10) */}
        <footer className="w-full pb-10 pt-6 relative z-10 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-12">
            {/* Left side: static text */}
            <div className="text-[#f3f3f2]/50 text-sm max-w-[140px] text-center sm:text-left leading-snug font-normal">
              Relied on by brands <br className="hidden sm:inline" /> across the globe
            </div>

            {/* Right side: infinite scrolling marquee */}
            <div className="overflow-hidden w-full sm:max-w-[700px] relative">
              {/* Fade masks on sides for smooth marquee transition */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#05020d] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#05020d] to-transparent z-10 pointer-events-none" />

              <div className="animate-marquee flex items-center gap-16">
                {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, idx) => (
                  <div key={idx} className="flex items-center gap-3 shrink-0 group cursor-pointer">
                    {/* Each logo: liquid-glass 24x24 (w-9 h-9) rounded-lg icon */}
                    <div className="liquid-glass w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white">
                      <span className={`bg-gradient-to-br ${logo.gradient} bg-clip-text text-transparent font-extrabold`}>
                        {logo.letter}
                      </span>
                    </div>
                    {/* Logo Name */}
                    <span className="text-base font-semibold text-[#f3f3f2] group-hover:text-white transition-colors">
                      {logo.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
