import { View, Text } from "react-native";
import { StatusBadge, type StatusType } from "./StatusBadge";

export interface DepartureRowProps {
  time: string;
  station: string;
  status: StatusType;
  statusLabel?: string;
  note?: string;
  muted?: boolean;
  showDivider?: boolean;
  className?: string;
}

export function DepartureRow({
  time,
  station,
  status,
  statusLabel,
  note,
  muted = false,
  showDivider = true,
  className = "",
}: DepartureRowProps) {
  const dividerClass = showDivider ? "border-t-2 border-black" : "";
  const backgroundClass = muted ? "bg-muted" : "bg-white";

  return (
    <View
      className={`flex-row items-stretch ${backgroundClass} ${dividerClass} ${className}`}
    >
      <View className="w-28 border-r-2 border-black px-4 py-3">
        <Text className="text-lg font-bold uppercase">{time}</Text>
      </View>
      <View className="flex-1 border-r-2 border-black px-4 py-3">
        <Text className="text-base font-bold uppercase">{station}</Text>
        {note ? (
          <Text className="mt-1 text-[11px] uppercase opacity-70">{note}</Text>
        ) : null}
      </View>
      <View className="w-32 items-end px-4 py-3">
        <StatusBadge
          status={status}
          label={statusLabel}
          className="w-full items-center justify-center"
        />
      </View>
    </View>
  );
}


