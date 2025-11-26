import { View, Text } from "react-native";

export interface CountdownHeroProps {
  label: string;
  sublabel?: string;
  value: string;
  className?: string;
}

export function CountdownHero({
  label,
  sublabel,
  value,
  className = "",
}: CountdownHeroProps) {
  return (
    <View
      className={`border-2 border-black bg-black px-6 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-semibold uppercase text-white opacity-70">
          {label}
        </Text>
        {sublabel ? (
          <Text className="text-xs font-semibold uppercase text-white opacity-70">
            · {sublabel}
          </Text>
        ) : null}
      </View>
      <Text className="mt-2 text-4xl font-black uppercase text-white">
        {value}
      </Text>
    </View>
  );
}

