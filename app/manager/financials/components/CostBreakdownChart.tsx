"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type DataPoint = {
  action_key: string;
  label: string;
  estimated_cost_eur: number;
};

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#facc15', '#10b981', '#3b82f6'];

export default function CostBreakdownChart({ data }: { data: DataPoint[] }) {
  // Filter out zero costs
  const chartData = data.filter(d => d.estimated_cost_eur > 0);

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="estimated_cost_eur"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            stroke="none"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => `€${Number(value).toFixed(4)}`}
            contentStyle={{ 
              backgroundColor: 'rgba(24, 24, 27, 0.9)', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: '#fff'
            }}
            itemStyle={{ color: '#e4e4e7', fontWeight: 600 }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '0.85rem' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
