"use client";

import { useState } from "react";
import type { StatusType, DepartureItem } from "@metlink/ui";

const sampleDepartures: DepartureItem[] = [
  { time: "23:00", station: "Upper Hutt", status: "on-time" },
  { time: "23:02", station: "Wallaceville", status: "on-time" },
  { time: "23:05", station: "Trentham", status: "delay", statusLabel: "+3 MIN" },
  { time: "23:07", station: "Heretaunga", status: "on-time" },
  { time: "23:09", station: "Silverstream", status: "on-time" },
  { time: "23:12", station: "Manor Park", status: "cancel" },
  { time: "23:14", station: "Pomare", status: "on-time" },
];

const statusConfig: Record<StatusType, { bg: string; text: string; defaultLabel: string }> = {
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

function StatusBadge({ status, label }: { status: StatusType; label?: string }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex w-24 items-center justify-center border-2 border-black px-2 py-1 text-xs font-bold uppercase ${config.bg} ${config.text}`}>
      {label ?? config.defaultLabel}
    </span>
  );
}

export default function Home() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transportFilter, setTransportFilter] = useState<"all" | "bus" | "train">("all");

  const showSearchResults = searchFocused || searchQuery.length > 0;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-black md:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        {/* Search Bar Row */}
        <section className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <div className="flex flex-1 items-center gap-3 border-2 border-black bg-white px-4 py-3 shadow-sharp-sm transition-colors hover:bg-zinc-50">
            <svg className="h-5 w-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="search transport"
              className="w-full bg-transparent text-sm uppercase outline-none placeholder:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center justify-center border-2 border-black bg-white px-4 py-3 text-lg shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </button>
            <button
              className="flex items-center justify-center border-2 border-black bg-white px-4 py-3 text-lg shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              aria-label="Nearby"
              title="Nearby"
            >
              ◎
            </button>
          </div>
        </section>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <section className="border-2 border-black bg-white p-4 shadow-sharp">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase opacity-70">
                {searchQuery ? `Results for "${searchQuery}"` : "Recent searches"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTransportFilter(transportFilter === "bus" ? "all" : "bus")}
                  className={`border-2 border-black px-4 py-2 text-sm font-bold uppercase shadow-sharp-sm transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    transportFilter === "bus" ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-50"
                  }`}
                >
                  bus
                </button>
                <button
                  onClick={() => setTransportFilter(transportFilter === "train" ? "all" : "train")}
                  className={`border-2 border-black px-4 py-2 text-sm font-bold uppercase shadow-sharp-sm transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    transportFilter === "train" ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-50"
                  }`}
                >
                  train
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <button className="border-2 border-black bg-white px-4 py-3 text-left shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                <span className="text-sm font-bold uppercase">Wellington Station</span>
              </button>
              <button className="border-2 border-black bg-white px-4 py-3 text-left shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                <span className="text-sm font-bold uppercase">Lambton Quay</span>
              </button>
              <button className="border-2 border-black bg-white px-4 py-3 text-left shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                <span className="text-sm font-bold uppercase">Upper Hutt</span>
              </button>
            </div>
          </section>
        )}

        {/* Stations/Stops + Favorites Row */}
        <section className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <button className="flex flex-1 items-center gap-3 border-2 border-black bg-white px-4 py-3 text-left shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            <svg className="h-5 w-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm uppercase opacity-50">stations/stops</span>
          </button>
          <div className="flex items-center gap-4 border-2 border-black bg-white px-4 py-3 shadow-sharp-sm">
            <span className="text-sm uppercase opacity-50">favorites</span>
            <div className="ml-auto flex gap-2">
              <button className="border-2 border-black bg-white px-3 py-1 text-sm font-bold uppercase shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                +add
              </button>
              <button className="border-2 border-black bg-white px-3 py-1 text-sm font-bold uppercase shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                manage
              </button>
            </div>
          </div>
        </section>

        {/* Route Header Card */}
        <section className="flex flex-col gap-4 border-2 border-black bg-white px-6 py-5 shadow-sharp md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-sm font-black">
              KPL
            </div>
            <div>
              <p className="text-2xl font-black uppercase">
                Trains from Upper Hutt to Wellington
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-4">
                <span className="text-xs font-semibold uppercase">Tuesday, 25 November 2025</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase opacity-70">Last updated:</span>
                  <span className="text-xs font-semibold uppercase">22:45:45</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Save
            </button>
            <button className="border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase shadow-sharp-sm transition-all hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Switch ↺
            </button>
          </div>
        </section>

        {/* Departure Table */}
        <section className="border-2 border-black bg-white shadow-sharp">
          {/* Header */}
          <div className="flex border-b-2 border-black bg-zinc-100 px-4 py-3">
            <div className="w-28">
              <span className="text-xs font-bold uppercase tracking-wide">Time</span>
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wide">Station</span>
            </div>
            <div className="w-32 text-right">
              <span className="text-xs font-bold uppercase tracking-wide">Status</span>
            </div>
          </div>
          {/* Rows */}
          {sampleDepartures.map((departure, index) => (
            <div
              key={`${departure.station}-${departure.time}`}
              className={`flex cursor-pointer items-stretch transition-colors ${index > 0 ? "border-t-2 border-black" : ""} ${index % 2 === 1 ? "bg-zinc-100 hover:bg-zinc-200" : "bg-white hover:bg-zinc-50"}`}
            >
              <div className="w-28 border-r-2 border-black px-4 py-3">
                <span className="text-lg font-bold uppercase">{departure.time}</span>
              </div>
              <div className="flex flex-1 flex-col justify-center border-r-2 border-black px-4 py-3">
                <span className="text-base font-bold uppercase">{departure.station}</span>
              </div>
              <div className="flex w-32 items-center justify-end px-4 py-3">
                <StatusBadge status={departure.status} label={departure.statusLabel} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
