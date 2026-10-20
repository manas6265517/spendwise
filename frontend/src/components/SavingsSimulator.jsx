import React, { useState, useEffect } from 'react';
import { Target, Calendar, TrendingUp, Sparkles, Rocket } from 'lucide-react';

export default function SavingsSimulator({ transactions }) {
  // Goal States
  const [goalName, setGoalName] = useState('MacBook Pro');
  const [targetAmount, setTargetAmount] = useState(120000);
  const [currentSaved, setCurrentSaved] = useState(25000);
  
  // Simulator State (The "What-If" slider)
  const [extraContribution, setExtraContribution] = useState(0);

  // Calculate user's real monthly savings from transactions
  const calculateBaselineSavings = () => {
    const incomes = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    // For this demo, we assume the net difference is their average monthly savings capacity
    const net = incomes - expenses;
    return net > 0 ? net : 0;
  };

  const baselineSavings = calculateBaselineSavings();
  const totalMonthlySavings = baselineSavings + extraContribution;
  const remainingAmount = Math.max(0, targetAmount - currentSaved);
  
  // Calculate months to reach goal
  const monthsToGoal = totalMonthlySavings > 0 ? Math.ceil(remainingAmount / totalMonthlySavings) : Infinity;

  // Calculate projected date
  const projectedDate = new Date();
  if (monthsToGoal !== Infinity) {
    projectedDate.setMonth(projectedDate.getMonth() + monthsToGoal);
  }

  const progressPercentage = Math.min((currentSaved / targetAmount) * 100, 100) || 0;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto mt-6">
      <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 rounded-2xl p-8 shadow-2xl">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Sparkles className="text-indigo-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Financial Intelligence Simulator</h2>
            <p className="text-slate-400">Play with your numbers to forecast your savings goals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT: Goal Setup */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">What are you saving for?</label>
              <div className="relative">
                <Target className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-12 p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Target Amount (₹)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Already Saved (₹)</label>
                <input
                  type="number"
                  value={currentSaved}
                  onChange={(e) => setCurrentSaved(Number(e.target.value))}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Interactive What-If Slider */}
            <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" size={18} />
                  What if I save extra each month?
                </label>
                <span className="text-emerald-400 font-bold">+₹{extraContribution.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={extraContribution}
                onChange={(e) => setExtraContribution(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-400 mt-3">
                Your current baseline savings rate is ₹{baselineSavings.toLocaleString('en-IN')}/mo based on your transactions.
              </p>
            </div>
          </div>

          {/* RIGHT: The Projection Result */}
          <div className="flex flex-col justify-center items-center p-8 bg-slate-900 border border-slate-700 rounded-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 w-full text-center">
              <h3 className="text-slate-400 text-lg mb-2">Goal Prediction</h3>
              <div className="text-3xl font-bold text-white mb-8 truncate px-4">{goalName}</div>

              {/* Progress Ring / Bar */}
              <div className="w-full bg-slate-800 rounded-full h-4 mb-4 border border-slate-700 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-slate-400 mb-8 font-medium">
                <span>₹{currentSaved.toLocaleString('en-IN')}</span>
                <span>{progressPercentage.toFixed(1)}%</span>
                <span>₹{targetAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* The Verdict */}
              {monthsToGoal === Infinity ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                  Your expenses exceed your income. Increase your savings to reach this goal.
                </div>
              ) : (
                <div className="p-6 bg-slate-800/80 border border-indigo-500/30 rounded-xl shadow-lg">
                  <div className="flex items-center justify-center gap-3 text-slate-300 mb-2">
                    <Rocket className="text-indigo-400" size={20} />
                    <span>You will reach your goal in</span>
                  </div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 mb-2">
                    {monthsToGoal} {monthsToGoal === 1 ? 'Month' : 'Months'}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-slate-400 font-medium mt-4">
                    <Calendar size={16} />
                    Target Date: <span className="text-white">{projectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}