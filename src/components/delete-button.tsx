"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  className = "p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors",
  title = "Xóa",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      title={title}
      onClick={(e) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa?")) {
          e.preventDefault();
        }
      }}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
