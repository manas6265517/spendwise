import React from 'react';

export default function BudgetTracker({ transactions, budgets }) {
  // 1. Get current month and year to filter transactions
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // 2. Calculate how much has been spent per category this month
  const currentMonthExpenses = transactions.filter(t => {
    const tDate = new Date(t.date || t.createdAt || Date.now());
    return t.type === 'EXPENSE' && 
           tDate.getMonth() === currentMonth && 
           tDate.getFullYear() === currentYear;
  });

  const spentByCategory = currentMonthExpenses.reduce((acc, t) => {
    const catName = t.category?.name || 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-6">Monthly Budgets</h2>
      
      <div className="space-y-6">
        {budgets.map((budget, index) => {
          const spent = spentByCategory[budget.category] || 0;
          const percentage = Math.min((spent / budget.limit) * 100, 100);
          
          // Determine progress bar color based on percentage
          let progressColor = "bg-emerald-500";
          if (percentage >= 90) progressColor = "bg-rose-500";
          else if (percentage >= 75) progressColor = "bg-amber-400";

          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-200 font-medium">{budget.category}</span>
                <span className="text-slate-400">
                  <span className="text-slate-200">₹{spent}</span> / ₹{budget.limit}
                </span>
              </div>
              {/* Progress Bar Background */}
              <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-700">
                {/* Progress Bar Fill */}
                <div 
                  className={`h-2.5 rounded-full ${progressColor} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              {percentage >= 100 && (
                <p className="text-xs text-rose-400 mt-1 font-medium">Budget exceeded!</p>
              )}
            </div>
          );
        })}

        {budgets.length === 0 && (
          <p className="text-slate-500 text-sm text-center">No budgets set for this month.</p>
        )}
      </div>
    </div>
  );
}