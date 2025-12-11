import { View, Text } from "react-native";

export type StatusType = "on-time" | "delay" | "cancel";

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; defaultLabel: string }
> = {
  "on-time": {
    bg: "bg-green-500",
    text: "text-white",
    defaultLabel: "ON TIME",
  },
  delay: {
    bg: "bg-yellow-400",
    text: "text-black",
    defaultLabel: "DELAYED",
  },
  cancel: {
    bg: "bg-red-500",
    text: "text-white",
    defaultLabel: "CANCELLED",
  },
};

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View
      className={`border-2 border-black px-2 py-1 ${config.bg} ${className}`}
    >
      <Text className={`text-xs font-bold uppercase ${config.text}`}>
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}








