import React from "react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded transition-colors duration-200 flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-primary hover:bg-[#4752c4] text-white",
    secondary: "bg-gray-600 hover:bg-gray-500 text-white",
    success: "bg-green hover:bg-[#3ba55d] text-white",
    danger: "bg-red hover:bg-[#c03537] text-white",
    ghost: "bg-transparent hover:bg-gray-700 text-gray-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
