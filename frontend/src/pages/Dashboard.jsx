import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Pencil } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
    setCategoryId(transaction.categoryId.toString());
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

  const expenseData = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => {
      const categoryName = curr.category?.name || 'Other';
      const existingCategory = acc.find(item => item.name === categoryName);
      if (existingCategory) {
        existingCategory.value += parseFloat(curr.amount);
      } else {
        acc.push({ name: categoryName, value: parseFloat(curr.amount) });
      }
      return acc;
    }, []);

  const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">SpendWise Dashboard</h1>
          <button onClick={handleLogout} className="bg-slate-200 text-slate-700 px-4 py-2 rounded hover:bg-slate-300 font-medium">
            Logout
          </button>
        </div>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Current Balance</h3>
            <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              ₹{currentBalance.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Total Income</h3>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{totalIncome.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Total Expenses</h3>
            <p className="text-2xl font-bold text-rose-600">
              ₹{totalExpense.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Moved Form and Transactions List UP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Add/Edit Transaction Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:col-span-1 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">
              {editingId ? 'Edit Transaction' : 'Add New'}
            </h2>
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Amount (₹)</label>
                <input type="number" required className="mt-1 block w-full p-2 border border-slate-300 rounded" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <input type="text" required className="mt-1 block w-full p-2 border border-slate-300 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select className="mt-1 block w-full p-2 border border-slate-300 rounded" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select className="mt-1 block w-full p-2 border border-slate-300 rounded" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="1">Salary</option>
                  <option value="2">Food & Dining</option>
                  <option value="3">Rent</option>
                  <option value="4">Utilities</option>
                  <option value="5">Entertainment</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium">
                  {editingId ? 'Update' : 'Save'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="w-full bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 font-medium">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Recent Transactions</h2>
            {transactions.length === 0 ? (
              <p className="text-slate-500">No transactions yet. Time to add some!</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className={`flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0 ${editingId === t.id ? 'bg-blue-50 -mx-2 px-2 rounded' : ''}`}>
                    <div>
                      <p className="font-medium text-slate-800">{t.description}</p>
                      <p className="text-sm text-slate-500">
                        {t.category?.name || 'Category'} • {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}₹{t.amount}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditClick(t)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          title="Edit transaction"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete transaction"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* Moved Chart Section DOWN */}
        {expenseData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Expense Breakdown</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}