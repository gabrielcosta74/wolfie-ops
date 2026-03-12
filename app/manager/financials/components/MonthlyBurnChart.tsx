"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type MonthRow = { month: string; count: number; tokens: number };

export default function MonthlyBurnChart({ data }: { data: MonthRow[] }) {
  // Assuming data is ascending chronologically
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255,255,255,0.4)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            stroke="rgba(255,255,255,0.4)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dx={-10} 
          />
          <Tooltip 
            formatter={(value: any) => [`${Number(value).toLocaleString('pt-PT')} Braincells`, 'Consumo']}
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
            type="monotone" 
            dataKey="tokens" 
            name="Braincells"
            stroke="#ef4444" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTokens)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
