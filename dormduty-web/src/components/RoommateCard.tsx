"use client";

import { Sparkles } from "lucide-react";

export type RoommateCardProps = {
  name: string;
  aura: number;
  role?: string | null;
};

export function RoommateCard({ name, aura, role }: RoommateCardProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white/70 p-4 text-center shadow-md backdrop-blur-md transition hover:scale-[1.02] hover:shadow-lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-300 bg-gradient-to-br from-blue-200 to-emerald-100 text-lg font-bold text-blue-700 shadow-inner">
        {name.charAt(0)}
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-800">{name}</h3>
      <div className="mt-1 flex items-center gap-1 text-sm font-medium text-emerald-600">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        {aura} Aura
      </div>
      {role ? (
        <span className="mt-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {role}
        </span>
      ) : null}
    </div>
  );
}
export default RoommateCard;
