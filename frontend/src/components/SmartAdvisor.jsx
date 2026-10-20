import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function SmartAdvisor({ transactions, budgets }) {
  const insights = [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter only this month's expenses
  const currentMonthExpenses = transactions.filter(t => {
    const tDate = new Date(t.date || t.createdAt || Date.now());
    return t.type === 'EXPENSE' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  if (currentMonthExpenses.length > 0) {
    // 1. Calculate spending by category
    const spentByCategory = currentMonthExpenses.reduce((acc, t) => {
      const catName = t.category?.name || 'Uncategorized';
      acc[catName] = (acc[catName] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    // 2. Find the highest spending category
    const highestCategory = Object.keys(spentByCategory).reduce((a, b) => 
      spentByCategory[a] > spentByCategory[b] ? a : b
    );
    
    insights.push({
      id: 'highest-spend',
      icon: <TrendingUp size={18} className="text-amber-400" />,
      text: `Your highest expense this month is ${highestCategory} (₹${spentByCategory[highestCategory]}). Keep an eye on this category!`
    });

    // 3. Check for budget warnings
    let budgetExceeded = false;
    budgets.forEach(b => {
      const spent = spentByCategory[b.category] || 0;
      if (spent > b.limit) {
        budgetExceeded = true;
        insights.push({
          id: `budget-warn-${b.category}`,
          icon: <AlertTriangle size={18} className="text-rose-400" />,
          text: `You have exceeded your ${b.category} budget by ₹${spent - b.limit}. Try to cut back for the rest of the month.`
        });
      }
    });

    // 4. Positive reinforcement if doing well
    if (!budgetExceeded) {
       insights.push({
         id: 'budget-success',
         icon: <CheckCircle2 size={18} className="text-emerald-400" />,
         text: "Great job! You are currently staying within all your set category budgets."
       });
    }
  } else {
    insights.push({
      id: 'no-data',
      icon: <Lightbulb size={18} className="text-blue-400" />,
      text: "Add some expenses this month to get personalized financial insights."
    });
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="text-amber-400" size={24} />
        <h2 className="text-lg font-semibold text-white">Smart Insights</h2>
      </div>
      <div className="flex flex-col gap-4">
        {insights.map(insight => (
          <div key={insight.id} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="mt-0.5 shrink-0">{insight.icon}</div>
            <p className="text-slate-300 text-sm leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}