import React from "react";

type Props = {
  icon: any;
  value: string | number;
  label: string;
};

export default function StatBox({ icon, value, label }: Props) {
  return (
    <div className="glass-panel p-2 flex flex-col items-center border border-white/5 bg-white/[0.02]">
      {icon}
      <span className="text-sm font-bold font-mono mt-1">{value}</span>
      <span className="text-[8px] text-neutral-500 uppercase font-black">
        {label}
      </span>
    </div>
  );
}

