import "./global.css";
import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Text, TextInput, Pressable } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  DepartureTable,
  type DepartureItem,
} from "@metlink/ui";

const Stack = createNativeStackNavigator();

const sampleDepartures: DepartureItem[] = [
  { time: "23:00", station: "Upper Hutt", status: "on-time" },
  { time: "23:02", station: "Wallaceville", status: "on-time" },
  { time: "23:05", station: "Trentham", status: "delay", statusLabel: "+3 MIN" },
  { time: "23:07", station: "Heretaunga", status: "on-time" },
  { time: "23:09", station: "Silverstream", status: "on-time" },
  { time: "23:12", station: "Manor Park", status: "cancel" },
  { time: "23:14", station: "Pomare", status: "on-time" },
];

function HomeScreen() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transportFilter, setTransportFilter] = useState<"all" | "bus" | "train">("all");

  const showSearchResults = searchFocused || searchQuery.length > 0;

  return (
    <ScrollView className="flex-1 bg-zinc-100">
      <View className="gap-4 p-4">
        {/* Search Bar Row */}
        <View className="flex-row gap-2">
          <View className="flex-1 border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <TextInput
              placeholder="search transport"
              placeholderTextColor="rgba(0,0,0,0.5)"
              className="text-sm uppercase"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
          </View>
          <Pressable
            className="items-center justify-center border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            accessibilityLabel="Settings"
          >
            <Text className="text-lg">⚙</Text>
          </Pressable>
          <Pressable
            className="items-center justify-center border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            accessibilityLabel="Nearby"
          >
            <Text className="text-lg">◎</Text>
          </Pressable>
        </View>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <View className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase opacity-70">
                {searchQuery ? `Results for "${searchQuery}"` : "Recent searches"}
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setTransportFilter(transportFilter === "bus" ? "all" : "bus")}
                  className={`border-2 border-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    transportFilter === "bus" ? "bg-black" : "bg-white"
                  }`}
                >
                  <Text className={`text-sm font-bold uppercase ${transportFilter === "bus" ? "text-white" : "text-black"}`}>
                    bus
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTransportFilter(transportFilter === "train" ? "all" : "train")}
                  className={`border-2 border-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    transportFilter === "train" ? "bg-black" : "bg-white"
                  }`}
                >
                  <Text className={`text-sm font-bold uppercase ${transportFilter === "train" ? "text-white" : "text-black"}`}>
                    train
                  </Text>
                </Pressable>
              </View>
            </View>
            <View className="mt-3 gap-2">
              <Pressable className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-sm font-bold uppercase">Wellington Station</Text>
              </Pressable>
              <Pressable className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-sm font-bold uppercase">Lambton Quay</Text>
              </Pressable>
              <Pressable className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-sm font-bold uppercase">Upper Hutt</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Stations/Stops + Favorites Row */}
        <View className="gap-4">
          <View className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-sm uppercase opacity-50">stations/stops</Text>
          </View>
          <View className="flex-row items-center border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-sm uppercase opacity-50">favorites</Text>
            <View className="ml-auto flex-row gap-2">
              <Pressable className="border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-sm font-bold uppercase">+add</Text>
              </Pressable>
              <Pressable className="border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-sm font-bold uppercase">manage</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Route Header Card */}
        <View className="border-2 border-black bg-white px-6 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-yellow-400">
              <Text className="text-sm font-black">KPL</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-black uppercase">
                Trains from Upper Hutt to Wellington
              </Text>
              <View className="mt-1 flex-row flex-wrap items-center gap-4">
                <Text className="text-xs font-semibold uppercase">Tuesday, 25 November 2025</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] font-semibold uppercase opacity-70">Last updated:</Text>
                  <Text className="text-xs font-semibold uppercase">22:45:45</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="mt-4 flex-row gap-3">
            <Pressable className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Text className="text-sm font-bold uppercase">Save</Text>
            </Pressable>
            <Pressable className="border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Text className="text-sm font-bold uppercase">Switch ↺</Text>
            </Pressable>
          </View>
        </View>

        {/* Departure Table */}
        <DepartureTable departures={sampleDepartures} />
      </View>
    </ScrollView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: "#f4f4f5",
              },
              headerTintColor: "#000000",
              headerTitleStyle: {
                fontWeight: "bold",
              },
              contentStyle: {
                backgroundColor: "#f4f4f5",
              },
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "METLINK VNEXT" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
