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
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-nav    { animation: fadeIn  0.5s ease 0.1s both; }
        .anim-logo   { animation: fadeIn  0.8s ease 0.3s both; }
        .anim-sub    { animation: fadeUp  0.6s ease 1.2s both; }
        .anim-btns   { animation: fadeUp  0.6s ease 1.5s both; }
        .anim-footer { animation: fadeIn  0.5s ease 1.8s both; }
      `}</style>

      <div className="min-h-screen text-white flex flex-col overflow-hidden" style={{ backgroundColor: "#111111" }}>

        {/* Nav */}
        <header className="anim-nav flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <span className="text-xs font-medium tracking-widest text-white uppercase">Troy VEX Robotics</span>
          <Link
            href="/login"
            className="text-sm font-medium text-white hover:text-white/70 transition-colors duration-200"
          >
            Sign in →
          </Link>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="flex flex-col items-center text-center gap-10">

            {/* Logo */}
            <div className="anim-logo relative w-[480px] h-[320px] select-none">
              <Image
                src="/hephaestus-logo.png"
                alt="Hephaestus"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Subtitle */}
            <p className="anim-sub text-sm text-white/45 leading-relaxed max-w-sm">
              VEX robotics parts inventory, team allocation,
              and supply tracking — all in one place.
            </p>

            {/* CTAs */}
            <div className="anim-btns flex items-center gap-4">
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-lg bg-white px-8 text-sm font-semibold text-black hover:bg-white/90 active:scale-95 transition-all duration-150"
              >
                Sign in
              </Link>
              <a
                href="mailto:ryanzhou1224@gmail.com?subject=Hephaestus%20Access%20Request"
                className="inline-flex h-11 items-center rounded-lg border border-white/15 bg-white/[0.05] px-8 text-sm font-medium text-white/70 hover:bg-white/[0.10] hover:text-white active:scale-95 transition-all duration-150"
              >
                Request access
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="anim-footer px-8 py-5 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/20">© 2026 Troy VEX Robotics</span>
          <span className="text-xs text-white/20">Hephaestus</span>
        </footer>

      </div>
    </>
  );
}
