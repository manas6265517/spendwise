import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Pencil } from 'lucide-react';
import ExpenseChart from './ExpenseChart';

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

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const response = await axios.get('https://spendwise-backend-sdmo.onrender.com/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
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

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">SpendWise Dashboard</h1>
          <button onClick={handleLogout} className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 font-medium transition-colors">
            Logout
          </button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-lg mb-4">{error}</div>}

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

        {/* Main Content Grid: Form & Transactions side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Add New / Edit Transaction Form */}
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 lg:col-span-1 h-fit">
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

          {/* Recent Transactions List */}
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {transactions && transactions.length > 0 ? transactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                  <div>
                    <h4 className="text-slate-200 font-medium">{t.description || "Transaction"}</h4>
                    <p className="text-sm text-slate-500">
                      {t.category?.name || "Uncategorized"} • {new Date(t.date || t.createdAt || Date.now()).toLocaleDateString()}
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
                 <p className="text-slate-500 text-center py-6">No transactions yet.</p>
              )}
            </div>
          </div>
          
        </div>

        {/* Expense Chart Section */}
        <div className="mb-8">
          <ExpenseChart transactions={transactions} />
        </div>

      </div>
    </div>
  );
}