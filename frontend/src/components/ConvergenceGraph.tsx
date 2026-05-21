"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { fetchGraphStats } from "@/lib/api";

interface Props {
  theoreticalWaitMean?: number;
  theoreticalServiceMean?: number;
}

interface DataPoint {
  car: number;
  value: number;
}

function buildSeries(values: number[]): DataPoint[] {
  return values.map((v, i) => ({ car: i + 1, value: v }));
}

function Graph({
  title,
  data,
  refLine,
  color,
  yLabel,
}: {
  title: string;
  data: DataPoint[];
  refLine?: number;
  color: string;
  yLabel: string;
}) {
  if (data.length === 0) {
    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
          flex: 1,
        }}
      >
        <div style={{ color: "#374151", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          {title}
        </div>
        <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", paddingTop: 32 }}>
          Laukiama duomenų...
        </div>
      </div>
    );
  }

  const minY = Math.min(...data.map((d) => d.value));
  const maxY = Math.max(...data.map((d) => d.value));
  const padding = Math.max((maxY - minY) * 0.15, 0.5);
  const domainMin = Math.max(0, minY - padding);
  const domainMax = maxY + padding;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "16px 20px 10px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ color: "#374151", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="car"
            tick={{ fill: "#374151", fontSize: 10 }}
            label={{ value: "Automobiliai", position: "insideBottom", offset: -2, fill: "#374151", fontSize: 10 }}
            height={28}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fill: "#374151", fontSize: 10 }}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#374151", fontSize: 10, offset: 10 }}
            width={46}
            tickFormatter={(v) => `${v.toFixed(1)}s`}
          />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 6 }}
            labelStyle={{ color: "#6b7280", fontSize: 11 }}
            itemStyle={{ color: color, fontSize: 12 }}
            formatter={(v) => [`${Number(v).toFixed(2)}s`, "Vidurkis"]}
            labelFormatter={(l) => `Automobilis #${l}`}
          />
          {refLine !== undefined && refLine > 0 && (
            <ReferenceLine
              y={refLine}
              stroke="#4b5563"
              strokeDasharray="6 3"
              label={{ value: `Teorinis: ${refLine.toFixed(1)}s`, fill: "#4b5563", fontSize: 10, position: "right" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ConvergenceGraph({ theoreticalWaitMean, theoreticalServiceMean }: Props) {
  const [waitSeries, setWaitSeries] = useState<DataPoint[]>([]);
  const [serviceSeries, setServiceSeries] = useState<DataPoint[]>([]);

  useEffect(() => {
    const load = () =>
      fetchGraphStats()
        .then((g) => {
          setWaitSeries(buildSeries(g.wait_time_series));
          setServiceSeries(buildSeries(g.service_time_series));
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <Graph
        title="Eiles laukimo vidurkis"
        data={waitSeries}
        refLine={theoreticalWaitMean}
        color="#3b82f6"
        yLabel="Laikas (s)"
      />
      <Graph
        title="Plovimo laiko vidurkis"
        data={serviceSeries}
        refLine={theoreticalServiceMean}
        color="#10b981"
        yLabel="Laikas (s)"
      />
    </div>
  );
}
