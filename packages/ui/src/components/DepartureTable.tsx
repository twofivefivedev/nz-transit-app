import { View, Text, ScrollView, type ViewProps } from "react-native";
import { DepartureRow, type DepartureRowProps } from "./DepartureRow";

export interface DepartureItem {
  time: string;
  station: string;
  status: DepartureRowProps["status"];
  statusLabel?: string;
  note?: string;
}

export interface DepartureTableProps extends ViewProps {
  departures: DepartureItem[];
  showHeader?: boolean;
  className?: string;
}

export function DepartureTable({
  departures,
  showHeader = true,
  className = "",
  ...props
}: DepartureTableProps) {
  return (
    <View
      className={`border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
      {...props}
    >
      {showHeader ? (
        <View className="flex-row border-b-2 border-black bg-zinc-100 px-4 py-3">
          <View className="w-28">
            <Text className="text-xs font-bold uppercase tracking-wide">Time</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-wide">Station</Text>
          </View>
          <View className="w-32">
            <Text className="text-right text-xs font-bold uppercase tracking-wide">
              Status
            </Text>
          </View>
        </View>
      ) : null}
      <ScrollView>
        {departures.map((departure, index) => (
          <DepartureRow
            key={`${departure.station}-${departure.time}-${index}`}
            time={departure.time}
            station={departure.station}
            status={departure.status}
            statusLabel={departure.statusLabel}
            note={departure.note}
            muted={index % 2 === 1}
            showDivider={index > 0}
          />
        ))}
      </ScrollView>
    </View>
  );
}

