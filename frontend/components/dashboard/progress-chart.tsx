"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useApp } from "@/components/providers/app-provider"

export function ProgressChart() {
  const { profile } = useApp()
  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-foreground/80">Weekly Fluency Progress</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={profile.progress}>
            <CartesianGrid stroke="color-mix(in oklch, var(--border) 60%, transparent)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
