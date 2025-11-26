import { View, Text, type ViewProps } from "react-native";
import { Button } from "./Button";

export interface FavoritesBarProps extends ViewProps {
  onAdd?: () => void;
  onManage?: () => void;
  className?: string;
}

export function FavoritesBar({
  onAdd,
  onManage,
  className = "",
  ...props
}: FavoritesBarProps) {
  return (
    <View
      className={`flex-row flex-wrap items-center justify-between gap-3 border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
      {...props}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-base">★</Text>
        <Text className="text-sm font-semibold uppercase">Favorites</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Button variant="outline" onPress={onAdd}>
          + Add
        </Button>
        <Button variant="outline" onPress={onManage}>
          Manage
        </Button>
      </View>
    </View>
  );
}

