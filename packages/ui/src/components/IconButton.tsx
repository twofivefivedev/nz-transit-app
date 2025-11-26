import { Pressable, Text, type PressableProps } from "react-native";

export interface IconButtonProps extends Omit<PressableProps, "children"> {
  icon: string;
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconButton({
  icon,
  label,
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  const sizeStyles = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2 text-xl",
    lg: "px-4 py-3 text-2xl",
  };

  return (
    <Pressable
      className={`flex-1 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${sizeStyles[size]} ${className}`}
      accessibilityLabel={label}
      accessibilityRole="button"
      {...props}
    >
      <Text className={sizeStyles[size]}>{icon}</Text>
    </Pressable>
  );
}

