import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // Already logged in → skip landing
  const profile = await getProfile();
  if (profile) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <span className="text-sm font-semibold tracking-tight text-white/80">Hephaestus</span>
        <Link
          href="/login"
          className="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50 tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500/80" />
            VEX Robotics Inventory Management
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight leading-none">
              Hephaestus
            </h1>
            <p className="text-lg text-white/40 leading-relaxed max-w-lg mx-auto">
              Parts inventory, team allocation, and supply tracking for competitive robotics programs.
            </p>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-md bg-white px-5 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
            >
              Sign in
            </Link>
            <a
              href="mailto:ryanzhou1224@gmail.com?subject=Hephaestus%20Access%20Request"
              className="inline-flex h-10 items-center rounded-md border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              Request access
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-white/20">Troy VEX Robotics</span>
        <span className="text-xs text-white/20">Hephaestus</span>
      </footer>
    </div>
  );
}
