"use client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team } from "@/lib/types";

export function ScopeFilter({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  function onChange(val: string) {
    const params = new URLSearchParams(sp.toString());
    if (val === "overall") {
      params.delete("team_id");
    } else {
      params.set("team_id", val);
    }
    router.push("?" + params.toString());
  }

  return (
    <Select
      defaultValue={sp.get("team_id") ?? "overall"}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="overall">All Teams</SelectItem>
        {teams
          .filter((t) => !t.archived)
          .map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
