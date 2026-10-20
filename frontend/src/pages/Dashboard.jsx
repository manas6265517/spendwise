import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Pencil } from 'lucide-react';
import ExpenseChart from './ExpenseChart'; // Your existing pie chart
import SpendingTrendChart from '../components/SpendingTrendChart'; // Our new line chart
import BudgetTracker from '../components/BudgetTracker'; 
import SmartAdvisor from '../components/SmartAdvisor';
import SavingsSimulator from '../components/SavingsSimulator';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [categoryId, setCategoryId] = useState('2');

  // Track if we are editing an existing transaction
  const [editingId, setEditingId] = useState(null);

  // 1. Add these new states right below your existing ones
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');

  const [budgets, setBudgets] = useState([
    { category: 'Food & Dining', limit: 8000 },
    { category: 'Rent', limit: 12000 },
    { category: 'Utilities', limit: 4000 },
    { category: 'Entertainment', limit: 3000 }
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');

  // 2. Add this filtering logic right before your return() statement
  const filteredTransactions = transactions.filter((t) => {
    // Search match (checks description and category name)
    const desc = t.description?.toLowerCase() || '';
    const cat = t.category?.name?.toLowerCase() || '';
    const searchMatch = desc.includes(searchTerm.toLowerCase()) || cat.includes(searchTerm.toLowerCase());
    
    // Type match
    const typeMatch = filterType === 'ALL' || t.type === filterType;
    
    // Month match
    const dateObj = new Date(t.date || t.createdAt || Date.now());
    const month = String(dateObj.getMonth() + 1); // Returns 1-12
    const monthMatch = filterMonth === 'ALL' || month === filterMonth;

    return searchMatch && typeMatch && monthMatch;
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Ensuring this points exactly to your Render backend, not localhost
        const response = await axios.get('https://spendwise-backend-sdmo.onrender.com/api/transactions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTransactions(response.data);
      } catch (err) {
        console.error("Dashboard API Error:", err.response || err);

        // Only kick the user out if the token is explicitly rejected
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          alert("Your login session is invalid. Please log in again.");
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          // If it's just a slow network or sleeping Render server, stay on the dashboard!
          alert("Network error: Could not fetch transactions, but you are logged in!");
        }
      }
    };

    fetchTransactions();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = { amount, description, type, categoryId };

      if (editingId) {
        // UPDATE existing transaction
        const response = await axios.put(`https://spendwise-backend-sdmo.onrender.com/api/transactions/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Swap out the old transaction with the newly updated one in the list
        setTransactions(transactions.map(t => (t.id === editingId ? response.data : t)));
        setEditingId(null);
      } else {
        // CREATE new transaction
        const response = await axios.post('https://spendwise-backend-sdmo.onrender.com/api/transactions', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions([response.data, ...transactions]);
      }

      // Clear the form fields
      setAmount('');
      setDescription('');
      setError('');
      setType('EXPENSE');
      setCategoryId('2');
    } catch (err) {
      setError(editingId ? 'Failed to update transaction.' : 'Failed to add transaction.');
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://spendwise-backend-sdmo.onrender.com/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(transactions.filter(t => t.id !== id));
      setError('');
      // If user deletes the transaction they are currently editing, clear the form
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError('Failed to delete transaction.');
    }
  };

  const handleEditClick = (transaction) => {
    setEditingId(transaction.id);
    setAmount(transaction.amount);
    setDescription(transaction.description);
    setType(transaction.type);
    setCategoryId(transaction.categoryId?.toString() || '2');
    // Scroll smoothly to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setType('EXPENSE');
    setCategoryId('2');
  };

  // Financial Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const currentBalance = totalIncome - totalExpense;

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert("No transactions to export!");
      return;
    }

    // 1. Create CSV Headers
    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount (₹)'];

    // 2. Format the data rows
    const csvRows = transactions.map(t => {
      // Format the date nicely
      const date = new Date(t.createdAt || t.date).toLocaleDateString('en-IN');
      // Wrap description and category in quotes in case they contain commas
      const desc = `"${t.description || ''}"`;
      const type = t.type;
      const category = `"${t.category?.name || 'Other'}"`;
      const amount = t.amount;

      return [date, desc, type, category, amount].join(',');
    });

    // 3. Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // 4. Create a downloadable Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 5. Create a hidden link and click it to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SpendWise_Transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto"> 

        {/* --- NEW MULTI-PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">SpendWise</h1>
            
            {/* Navigation Tabs (Desktop) */}
            <div className="hidden md:flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('simulator')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
              >
                Goals & Simulator
              </button>
            </div>
          </div>

          <button onClick={handleLogout} className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 font-medium transition-colors">
            Logout
          </button>
        </div>
        
        {/* Navigation Tabs (Mobile) */}
        <div className="md:hidden flex bg-slate-800 rounded-lg p-1 border border-slate-700 mb-6">
           <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 rounded-md text-sm font-medium ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Dashboard</button>
           <button onClick={() => setActiveTab('simulator')} className={`flex-1 py-2 rounded-md text-sm font-medium ${activeTab === 'simulator' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Simulator</button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-lg mb-4">{error}</div>}

        {/* --- PAGE RENDERING LOGIC --- */}
        {activeTab === 'simulator' ? (
          
          /* Render the new Simulator Page */
          <SavingsSimulator transactions={transactions} />
          
        ) : (
          
          /* Render your existing Dashboard Content */
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Current Balance</h3>
                <p className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  ₹{currentBalance.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Total Income</h3>
                <p className="text-3xl font-bold text-emerald-400">
                  ₹{totalIncome.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Total Expenses</h3>
                <p className="text-3xl font-bold text-rose-400">
                  ₹{totalExpense.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Main Content Grid: Form & Insights (Left) and Transactions (Right) */} 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"> 
              
              {/* LEFT COLUMN: Stacked Form and Smart Advisor */}
              <div className="lg:col-span-1 flex flex-col gap-6 h-fit">
                
                {/* Add New / Edit Transaction Form */}
                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    {editingId ? "Edit Transaction" : "Add New"}
                  </h2>

                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-1">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-1">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="1">Salary</option>
                      <option value="2">Food & Dining</option>
                      <option value="3">Rent</option>
                      <option value="4">Utilities</option>
                      <option value="5">Entertainment</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitTransaction}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                    >
                      {editingId ? "Update" : "Save"}
                    </button>

                    {editingId && (
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Smart Advisor Component */}
                <SmartAdvisor transactions={transactions} budgets={budgets} />
                
              </div>

              {/* RIGHT COLUMN: Recent Transactions List */}
              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 lg:col-span-2 flex flex-col h-full">
                
                {/* Header with Export Button */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                  
                  <button
                    onClick={handleExportCSV}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-1.5 px-4 rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </button>
                </div>

                {/* Smart Search & Filters Bar */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <input 
                    type="text" 
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  />
                  
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  >
                    <option value="ALL">All Types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>

                  <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  >
                    <option value="ALL">All Months</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                {/* Transactions List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0 pb-2">
                  {filteredTransactions && filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                      <div>
                        <h4 className="text-slate-200 font-medium">{t.description || "Transaction"}</h4>
                        <p className="text-sm text-slate-500">
                          {t.category?.name || "Uncategorized"} • {new Date(t.date || t.createdAt || Date.now()).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${t.type === 'EXPENSE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {t.type === 'EXPENSE' ? '-' : '+'}₹{Math.abs(t.amount)}
                        </span>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditClick(t)}
                            className="text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-slate-500 text-center py-6">No matching transactions found.</p>
                  )}
                </div>
              </div>

            </div> 

            {/* Analytics & Budgets Section */}
            <div className="mb-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ExpenseChart transactions={transactions} />
              </div>
              <div className="lg:col-span-1">
                <BudgetTracker transactions={transactions} budgets={budgets} />
              </div>
              <div className="lg:col-span-1">
                <SpendingTrendChart transactions={transactions} />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}