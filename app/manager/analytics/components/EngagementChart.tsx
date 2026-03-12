"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type DataPoint = {
  day: string;
  dau: number;
  total_events: number;
};

export default function EngagementChart({ data }: { data: DataPoint[] }) {
  // Recharts needs date sorted for AreaChart to look best, usually left to right means oldest to newest. 
  // We assume data is sorted newest-to-oldest, so we reverse it for viewing.
  const chartData = [...data].reverse().map(d => ({
    ...d,
    // simplify date to "DD/MM" for x-axis
    formattedDate: new Date(d.day).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="formattedDate" 
            stroke="rgba(255,255,255,0.4)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            yAxisId="left"
            stroke="rgba(255,255,255,0.4)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dx={-10} 
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="rgba(255,255,255,0.4)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dx={10} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(24, 24, 27, 0.9)', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: '#fff'
            }}
            itemStyle={{ color: '#e4e4e7', fontWeight: 600 }}
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="dau" 
            name="DAU"
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorDau)" 
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="total_events" 
            name="Eventos"
            stroke="#a855f7" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorEvents)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
