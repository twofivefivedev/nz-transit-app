import "./global.css";
import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Text, TextInput, Pressable } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Svg, { Path, Circle } from "react-native-svg";
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

// Icon Components using react-native-svg (Heroicons style)
function SearchIcon({ size = 20, color = "black", opacity = 1 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <Circle cx="11" cy="11" r="8" />
      <Path d="m21 21-4.35-4.35" />
    </Svg>
  );
}

function LocationIcon({ size = 20, color = "black", opacity = 1 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

function SettingsIcon({ size = 20, color = "black" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

function NearbyIcon({ size = 20, color = "black" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12h3" />
      <Path d="M19 12h3" />
      <Path d="M12 2v3" />
      <Path d="M12 19v3" />
      <Circle cx="12" cy="12" r="7" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

function BookmarkIcon({ size = 20, color = "black" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </Svg>
  );
}

function HeartIcon({ size = 20, color = "black" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Svg>
  );
}

function SwitchIcon({ size = 20, color = "black" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m16 3 4 4-4 4" />
      <Path d="M20 7H4" />
      <Path d="m8 21-4-4 4-4" />
      <Path d="M4 17h16" />
    </Svg>
  );
}

// Line Badge Component (custom - circle background)
function LineBadge({ code, color = "#facc15" }: { code: string; color?: string }) {
  return (
    <View 
      style={{ 
        backgroundColor: color,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: "900", color: "#000" }}>{code}</Text>
    </View>
  );
}

function HomeScreen() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transportFilter, setTransportFilter] = useState<"all" | "bus" | "train">("all");

  const showSearchResults = searchFocused || searchQuery.length > 0;

  return (
    <ScrollView className="flex-1 bg-zinc-100">
      <View className="gap-4 px-4 py-4">
        {/* Search Bar Row */}
        <View className="flex-row items-center gap-3 border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <SearchIcon size={20} opacity={0.5} />
          <TextInput
            placeholder="SEARCH TRANSPORT"
            placeholderTextColor="rgba(0,0,0,0.5)"
            className="flex-1 text-sm uppercase"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
        </View>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <View 
            className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            style={{ padding: 16 }}
          >
            <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
              <Text className="text-xs font-semibold uppercase opacity-70">
                {searchQuery ? `Results for "${searchQuery}"` : "Recent searches"}
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => setTransportFilter(transportFilter === "bus" ? "all" : "bus")}
                  className={`border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    transportFilter === "bus" ? "bg-black" : "bg-white"
                  }`}
                  style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  <Text className={`text-sm font-bold uppercase ${transportFilter === "bus" ? "text-white" : "text-black"}`}>
                    bus
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTransportFilter(transportFilter === "train" ? "all" : "train")}
                  className={`border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    transportFilter === "train" ? "bg-black" : "bg-white"
                  }`}
                  style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  <Text className={`text-sm font-bold uppercase ${transportFilter === "train" ? "text-white" : "text-black"}`}>
                    train
                  </Text>
                </Pressable>
              </View>
            </View>
            <View className="border-t-2 border-black">
              <Pressable 
                className="border-b-2 border-black bg-white"
                style={{ paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text className="text-sm font-bold uppercase">Wellington Station</Text>
              </Pressable>
              <Pressable 
                className="border-b-2 border-black bg-white"
                style={{ paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text className="text-sm font-bold uppercase">Lambton Quay</Text>
              </Pressable>
              <Pressable 
                className="bg-white"
                style={{ paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text className="text-sm font-bold uppercase">Upper Hutt</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Stations/Stops Row with Settings, Nearby, Favorites */}
        <View className="flex-row gap-2">
          <Pressable className="flex-1 flex-row items-center gap-3 border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <LocationIcon size={20} opacity={0.5} />
            <Text className="text-sm uppercase opacity-50">STATIONS/STOPS</Text>
          </Pressable>
          <Pressable
            className="items-center justify-center border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            accessibilityLabel="Settings"
          >
            <SettingsIcon size={20} />
          </Pressable>
          <Pressable
            className="items-center justify-center border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            accessibilityLabel="Nearby"
          >
            <NearbyIcon size={20} />
          </Pressable>
          <Pressable 
            className="items-center justify-center border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            accessibilityLabel="Favorites"
          >
            <HeartIcon size={20} />
          </Pressable>
        </View>

        {/* Route Header Card */}
        <View 
          className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{ paddingHorizontal: 20, paddingVertical: 16 }}
        >
          <View className="flex-row items-center" style={{ gap: 16 }}>
            <LineBadge code="KPL" />
            <Text className="flex-1 text-base font-black uppercase" numberOfLines={2}>
              Trains from Upper Hutt to Wellington
            </Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable 
                className="items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                style={{ padding: 10 }}
                accessibilityLabel="Save"
              >
                <BookmarkIcon size={18} />
              </Pressable>
              <Pressable 
                className="items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                style={{ padding: 10 }}
                accessibilityLabel="Switch direction"
              >
                <SwitchIcon size={18} />
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center" style={{ marginTop: 12, gap: 8 }}>
            <Text className="text-xs font-semibold uppercase opacity-70">Tuesday, 25 November 2025</Text>
            <Text className="text-[10px] uppercase opacity-50">•</Text>
            <Text className="text-xs font-semibold uppercase opacity-70">22:45:45</Text>
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
