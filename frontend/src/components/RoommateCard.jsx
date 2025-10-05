import React from "react";
import { Sparkles } from "lucide-react";

const Avatar = ({ avatar, name }) => {
  const base = "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border shadow-inner overflow-hidden";
  if (avatar && /^(https?:|data:)/.test(avatar)) {
    return <img src={avatar} alt={name} className={`${base} border-blue-300`} />;
  }
  const content = avatar || (name ? name.charAt(0) : "");
  return (
    <div className={`${base} bg-gradient-to-br from-blue-200 to-emerald-100 text-blue-700 border-blue-300`}>
      <span>{content}</span>
    </div>
  );
};

const RoommateCard = ({ name, aura, role, avatar, bio }) => {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition transform hover:scale-[1.02] p-4 flex flex-col items-center text-center">
      <Avatar avatar={avatar} name={name} />

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

      {bio && (
        <p className="mt-2 text-xs text-gray-500 max-w-[180px]">{bio}</p>
      )}
    </div>
  );
};

export default RoommateCard;
