"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BRANCHES, type Branch } from "@/lib/library";

type BranchFilterProps = {
  currentBranch?: string;
  onBranchChange?: (branch: string) => void;
};

export default function BranchFilter({ currentBranch = "DSA", onBranchChange }: BranchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const active = searchParams.get("branch") || currentBranch;

  function setBranch(b: string) {
    if (onBranchChange) {
      onBranchChange(b);
      return;
    }
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (b === "DSA") {
        params.delete("branch"); // default
      } else {
        params.set("branch", b);
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#262626] rounded-xl w-fit">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-2.5">
        Branch:
      </span>
      {BRANCHES.map((branch) => {
        const isSelected = active === branch;
        return (
          <button
            key={branch}
            type="button"
            onClick={() => setBranch(branch)}
            disabled={isPending}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isSelected
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/60"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1F1F1F]"
            }`}
          >
            {branch}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setBranch("ALL")}
        disabled={isPending}
        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
          active === "ALL"
            ? "bg-zinc-700 text-white"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1F1F1F]"
        }`}
      >
        All
      </button>
    </div>
  );
}
