"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

type DataPoint = {
  day: string;
  quizzes_started: number;
  quizzes_completed: number;
  chat_messages: number;
};

export default function FeatureUsageChart({ data }: { data: DataPoint[] }) {
  const chartData = [...data].reverse().map(d => ({
    ...d,
    formattedDate: new Date(d.day).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            stroke="rgba(255,255,255,0.4)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dx={-10} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ 
              backgroundColor: 'rgba(24, 24, 27, 0.9)', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: '#fff'
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', opacity: 0.8 }} />
          <Bar dataKey="quizzes_started" name="Quizzes Iniciados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="quizzes_completed" name="Quizzes Concl." fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="chat_messages" name="Mensagens Chat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
