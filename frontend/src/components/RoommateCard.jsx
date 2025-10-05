import React from "react";
import { Sparkles } from "lucide-react";

const RoommateCard = ({ name, aura, role }) => {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition transform hover:scale-[1.02] p-4 flex flex-col items-center text-center">
      {/* Avatar Circle */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-200 to-emerald-100 flex items-center justify-center text-lg font-bold text-blue-700 border border-blue-300 shadow-inner">
        {name.charAt(0)}
      </div>

      {/* Name */}
      <h3 className="mt-3 text-base font-semibold text-gray-800">{name}</h3>

      {/* Aura Points */}
      <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium mt-1">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        {aura} Aura
      </div>

      {/* Role Tag (Optional) */}
      {role && (
        <span className="mt-2 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
          {role}
        </span>
      )}
    </div>
  );
};

export default RoommateCard;
