"use client";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap } from "lucide-react";
import type { Profile } from "@/lib/types";
import { Tutorial } from "@/components/tutorial/tutorial";

const roleColors: Record<string, string> = {
  owner: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  admin: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  member: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [showTutorial, setShowTutorial] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-background px-6">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${roleColors[profile.role] ?? roleColors.member}`}
        >
          {profile.role}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-2">
            {profile.full_name || profile.email}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)} title="Tutorial" className="h-8 w-8">
            <GraduationCap className="h-4 w-4" />
          </Button>
          <NotificationBell />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </>
  );
}
