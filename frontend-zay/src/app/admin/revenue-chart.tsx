'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

type Point = { day: string; ca: number };

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4537E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D4537E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD6" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#8A7068', fontWeight: 'bold' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#8A7068', fontWeight: 'bold' }}
          tickFormatter={(value) => `${value}€`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FAF7F4',
            border: '1px solid #E8DDD6',
            borderRadius: '0',
          }}
          labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
        />
        <Area
          type="monotone"
          dataKey="ca"
          stroke="#D4537E"
          fillOpacity={1}
          fill="url(#colorCa)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
