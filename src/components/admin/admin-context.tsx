"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type DashboardRange = 7 | 30 | 90;

const DashboardRangeContext = createContext<{
  range: DashboardRange;
  setRange: (range: DashboardRange) => void;
}>({
  range: 30,
  setRange: () => {},
});

export function DashboardRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DashboardRange>(30);
  return (
    <DashboardRangeContext.Provider value={{ range, setRange }}>
      {children}
    </DashboardRangeContext.Provider>
  );
}

export function useDashboardRange() {
  return useContext(DashboardRangeContext);
}