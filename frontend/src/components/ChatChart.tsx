import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface ChartSpec {
  type: "bar" | "line";
  data: any[];
  xKey: string;
  yKey: string;
}

export default function ChatChart({ spec }: { spec: ChartSpec }) {
  if (!spec || !spec.data || spec.data.length === 0) {
    return <div className="p-4 text-sm text-muted">No data available for chart.</div>;
  }

  const { type, data, xKey, yKey } = spec;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface2/90 backdrop-blur-md border border-line p-3 rounded-xl shadow-xl">
          <p className="text-paper text-xs font-bold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[280px] mt-4 mb-2 bg-surface2/30 border border-line/50 rounded-2xl p-4 overflow-hidden shadow-inner">
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey={xKey} stroke="var(--color-muted)" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--color-muted)" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            <Line
              type="monotone"
              dataKey={yKey}
              name={yKey.charAt(0).toUpperCase() + yKey.slice(1)}
              stroke="var(--color-brass)"
              strokeWidth={3}
              dot={{ fill: "var(--color-brass)", r: 4 }}
              activeDot={{ r: 6, fill: "var(--color-brasslight)" }}
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey={xKey} stroke="var(--color-muted)" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--color-muted)" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            <Bar
              dataKey={yKey}
              name={yKey.charAt(0).toUpperCase() + yKey.slice(1)}
              fill="var(--color-brass)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
