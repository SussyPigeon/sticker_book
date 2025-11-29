import * as React from "react";
import { cn } from "@/lib/utils";

const Input = ({ label, error, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-bold text-gray-300 uppercase">
          {label}
        </label>
      )}
      <input
        className={`bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-discord-blurple transition-colors ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-discord-red italic">{error}</span>
      )}
    </div>
  );
};

export { Input };
