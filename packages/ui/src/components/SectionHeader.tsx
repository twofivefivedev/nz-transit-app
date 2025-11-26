import { View, Text, type ViewProps } from "react-native";

export interface SectionHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  timestamp?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  timestamp,
  className = "",
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <View
      className={`border-2 border-black bg-white px-6 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
      {...props}
    >
      <View className="flex-1">
        <Text className="text-2xl font-black uppercase">{title}</Text>
        {subtitle || timestamp ? (
          <View className="mt-2 flex-row flex-wrap items-center gap-4">
            {subtitle ? (
              <Text className="text-xs font-semibold uppercase">{subtitle}</Text>
            ) : null}
            {timestamp ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-[10px] font-semibold uppercase opacity-70">
                  Last updated:
                </Text>
                <Text className="text-xs font-semibold uppercase">{timestamp}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

