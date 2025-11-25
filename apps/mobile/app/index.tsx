import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl font-bold">Metlink vNext</Text>
      <Text className="mt-4 text-lg">A scalable, multi-modal transit platform</Text>
      <StatusBar style="auto" />
    </View>
  );
}


