import React from "react";
import clsx from "clsx";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded border border-gray-300 px-3 py-2 text-[15px] shadow-sm",
        "focus:border-[#3f9ad6] focus:ring-[#3f9ad6] focus:ring-2 outline-none transition",
        className
      )}
      {...props}
    />
  );
});
