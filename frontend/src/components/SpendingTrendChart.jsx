import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function SpendingTrendChart({ transactions }) {
  // If no transactions, show a placeholder
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 flex items-center justify-center h-80">
        <p className="text-slate-500">Not enough data to display the chart.</p>
      </div>
    );
  }

  // 1. Process data to group by date
  const chartData = transactions.reduce((acc, curr) => {
    // Format date as DD/MM
    const dateObj = new Date(curr.date || curr.createdAt || Date.now());
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

    // Find if this date already exists in our accumulator
    const existingDate = acc.find((item) => item.date === dateStr);

    if (existingDate) {
      if (curr.type === 'EXPENSE') existingDate.Expense += Math.abs(curr.amount);
      if (curr.type === 'INCOME') existingDate.Income += curr.amount;
    } else {
      acc.push({
        date: dateStr,
        Expense: curr.type === 'EXPENSE' ? Math.abs(curr.amount) : 0,
        Income: curr.type === 'INCOME' ? curr.amount : 0,
      });
    }
    return acc;
  }, []);

  // Sort data by date (oldest to newest)
  chartData.sort((a, b) => {
    const [dayA, monthA] = a.date.split('/');
    const [dayB, monthB] = b.date.split('/');
    return new Date(2026, monthA - 1, dayA) - new Date(2026, monthB - 1, dayB);
  });

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-6">Income vs Expense Trend</h2>
      
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Line 
              type="monotone" 
              name="Income"
              dataKey="Income" 
              stroke="#34d399" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              name="Expense"
              dataKey="Expense" 
              stroke="#fb7185" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}