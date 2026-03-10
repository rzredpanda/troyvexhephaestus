"use client";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { Profile } from "@/lib/types";

export function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <span className="section-label">{profile.role.toUpperCase()}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {profile.full_name || profile.email}
        </span>
        <NotificationBell />
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
