import { Pressable, Text, View, type PressableProps } from "react-native";

export interface FilterSelectProps extends Omit<PressableProps, "children"> {
  label: string;
  value: string;
  className?: string;
}

export function FilterSelect({
  label,
  value,
  className = "",
  ...props
}: FilterSelectProps) {
  return (
    <Pressable
      className={`flex-1 border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${className}`}
      {...props}
    >
      <Text className="text-xs font-semibold uppercase opacity-70">{label}</Text>
      <Text className="text-xl font-black uppercase">{value}</Text>
    </Pressable>
  );
}

