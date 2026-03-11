import Link from "next/link";
import Image from "next/image";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const profile = await getProfile();
  if (profile) redirect("/dashboard");

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes hammerstrike {
          0%   { transform: rotate(0deg) translateY(0); }
          30%  { transform: rotate(-12deg) translateY(-6px); }
          55%  { transform: rotate(8deg) translateY(3px); }
          70%  { transform: rotate(-5deg) translateY(-2px); }
          85%  { transform: rotate(3deg) translateY(1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes glow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 8px rgba(249,115,22,0.0)); }
          50%       { filter: brightness(1.15) drop-shadow(0 0 24px rgba(249,115,22,0.55)); }
        }
        @keyframes sparks {
          0%   { opacity: 0; transform: scale(0.7) translateY(4px); }
          40%  { opacity: 1; transform: scale(1.1) translateY(-6px); }
          100% { opacity: 0; transform: scale(0.8) translateY(-18px); }
        }
        .anim-logo   { animation: scaleIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .anim-strike { animation: hammerstrike 0.7s ease-in-out 1.2s both; }
        .anim-glow   { animation: glow 2.8s ease-in-out 1.2s infinite; }
        .anim-sub    { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.7s both; }
        .anim-btns   { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 1.0s both; }
        .anim-nav    { animation: fadeIn 0.6s ease 0.2s both; }
        .anim-footer { animation: fadeIn 0.6s ease 1.3s both; }
      `}</style>

      <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col overflow-hidden">

        {/* Nav */}
        <header className="anim-nav flex items-center justify-between px-8 py-5 border-b border-white/[0.05]">
          <span className="text-xs font-medium tracking-widest text-white/25 uppercase">Troy VEX Robotics</span>
          <Link
            href="/login"
            className="text-sm font-medium text-white/40 hover:text-white transition-colors duration-200"
          >
            Sign in →
          </Link>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="flex flex-col items-center text-center gap-8 max-w-xl">

            {/* Logo image — animated */}
            <div className="anim-logo anim-glow relative w-72 h-48 select-none">
              <div className="anim-strike w-full h-full">
                <Image
                  src="/hephaestus-logo.png"
                  alt="Hephaestus"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Subtitle */}
            <div className="anim-sub space-y-3">
              <p className="text-base text-white/40 leading-relaxed">
                VEX robotics parts inventory, team allocation,<br className="hidden sm:block" />
                and supply tracking — all in one place.
              </p>
            </div>

            {/* CTAs */}
            <div className="anim-btns flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-lg bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 active:scale-95 transition-all duration-150"
              >
                Sign in
              </Link>
              <a
                href="mailto:ryanzhou1224@gmail.com?subject=Hephaestus%20Access%20Request"
                className="inline-flex h-10 items-center rounded-lg border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-white/60 hover:bg-white/[0.09] hover:text-white active:scale-95 transition-all duration-150"
              >
                Request access
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="anim-footer px-8 py-5 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-xs text-white/15">© 2026 Troy VEX Robotics</span>
          <span className="text-xs text-white/15">Hephaestus</span>
        </footer>

      </div>
    </>
  );
}
