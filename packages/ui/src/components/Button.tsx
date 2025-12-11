import { Pressable, Text, type PressableProps } from "react-native";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "border-2 border-black px-4 py-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

  const variantStyles = {
    default: "bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    outline: "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  };

  const textStyles = {
    default: "text-white",
    outline: "text-black",
  };

  return (
    <Pressable
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Text
        className={`text-center text-sm font-bold uppercase ${textStyles[variant]}`}
      >
        {children}
      </Text>
    </Pressable>
  );
}








