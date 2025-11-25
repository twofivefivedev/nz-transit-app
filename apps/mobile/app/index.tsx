import { View, Text } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-8">
      <View className="border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Text className="mb-4 text-4xl font-bold uppercase tracking-tight text-black">
          METLINK VNEXT
        </Text>
        <Text className="mb-6 text-lg uppercase text-zinc-600">
          REAL-TIME TRANSIT FOR WELLINGTON
        </Text>
        <View className="flex-row gap-4">
          <View className="border-2 border-black bg-zinc-100 px-4 py-2">
            <Text className="text-sm uppercase text-black">TRAIN</Text>
          </View>
          <View className="border-2 border-black bg-zinc-100 px-4 py-2">
            <Text className="text-sm uppercase text-black">BUS</Text>
          </View>
        </View>
      </View>
    </View>
  );
}


