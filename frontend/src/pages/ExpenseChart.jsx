import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Updated to sleek, modern colors that look great on dark mode
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const ExpenseChart = ({ transactions }) => {
  const dataMap = transactions.reduce((acc, transaction) => {
    // Make sure we only count expenses
    const isExpense = 
      (transaction.type && transaction.type.toUpperCase() === 'EXPENSE') || 
      Number(transaction.amount) < 0;

    if (!isExpense) return acc;

    const amount = Math.abs(Number(transaction.amount));

    let categoryName = 'Other';
    if (typeof transaction.category === 'string') {
      categoryName = transaction.category;
    } else if (transaction.category && transaction.category.name) {
      categoryName = transaction.category.name;
    }

    acc[categoryName] = (acc[categoryName] || 0) + amount;
    return acc;
  }, {});

  const data = Object.keys(dataMap).map((key) => ({
    name: key,
    value: dataMap[key],
  }));

  // Dark mode empty state
  if (data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 w-full h-[350px] flex items-center justify-center">
         <p className="text-slate-400">No expenses yet to show!</p>
      </div>
    );
  }

  return (
    // Replaced inline styles with Tailwind dark mode classes
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 w-full h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-4 text-center">Expense Breakdown</h3>
      
      {/* We subtract a bit of height so the legend fits perfectly */}
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70} // This brings back the hollow Donut shape!
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1e293b" strokeWidth={2} />
              ))}
            </Pie>
            
            {/* Dark mode tooltip */}
            <Tooltip 
              formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            
            <Legend wrapperStyle={{ paddingTop: '20px', color: '#cbd5e1' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseChart;