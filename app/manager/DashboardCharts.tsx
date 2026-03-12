"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DifficultyData {
  facil: number;
  medio: number;
  dificil: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export function DifficultyDonutChart({ data }: { data: DifficultyData }) {
  const chartData = [
    { name: 'Fácil', value: data.facil },
    { name: 'Médio', value: data.medio },
    { name: 'Difícil', value: data.dificil },
  ];

  return (
    <div style={{ width: '100%', height: 250 }}>
      {/* 
        A custom tooltip is necessary to maintain the glassmorphism aesthetic 
        and dark theme instead of the default recharts tooltip.
      */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                style={{ filter: `drop-shadow(0px 0px 8px ${COLORS[index % COLORS.length]}80)` }}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(30, 27, 75, 0.7)', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
