const express = require('express');
const prisma = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions - Fetch all transactions for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      include: { category: true },
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/transactions - Add a new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount, type, categoryId, description, date } = req.body;

    if (!amount || !type || !categoryId) {
      return res.status(400).json({ error: 'Amount, type, and category are required' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        description,
        userId: req.user.userId,
        categoryId: parseInt(categoryId),
        date: date ? new Date(date) : new Date()
      },
      include: { category: true }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// PUT /api/transactions/:id - Update an existing transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { amount, type, categoryId, description, date } = req.body;

    // Verify the transaction belongs to the logged-in user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: req.user.userId }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update the transaction in the database
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        amount: parseFloat(amount),
        type,
        description,
        categoryId: parseInt(categoryId),
        date: date ? new Date(date) : existingTransaction.date
      },
      include: { category: true } // Ensure we return the category name for the frontend
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id - Delete a specific transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);

    // First, verify the transaction belongs to the logged-in user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { 
        id: transactionId, 
        userId: req.user.userId 
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    // If it belongs to them, delete it
    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// POST: /api/transactions/bulk
router.post('/bulk', async (req, res) => {
  try {
    const { userId, transactions } = req.body;

    const categories = await prisma.category.findMany();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
    });

    const formattedTransactions = transactions
      .map(t => {
        // Date handling
        const dateKey = Object.keys(t).find(key => key.toLowerCase().includes('date'));
        const dateString = dateKey ? t[dateKey] : null;
        let isoDate = new Date();
        if (dateString) {
          const [day, month, year] = dateString.split('/');
          if (year && month && day) isoDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
        }

        // Category handling
        const catKey = Object.keys(t).find(key => key.toLowerCase().includes('category'));
        const catName = catKey ? String(t[catKey]).toLowerCase() : '';
        const categoryId = categoryMap[catName] || 1; 

        // Amount handling - dynamically finds any column with "amount" in the name
        const amountKey = Object.keys(t).find(key => key.toLowerCase().includes('amount'));
        const rawAmount = amountKey ? t[amountKey] : "0";
        const parsedAmount = parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, ""));

        // Description and Type handling
        const descKey = Object.keys(t).find(key => key.toLowerCase().includes('desc'));
        const typeKey = Object.keys(t).find(key => key.toLowerCase().includes('type'));

        return {
          userId: parseInt(userId),
          description: descKey ? t[descKey] : 'Imported Transaction',
          amount: parsedAmount,
          type: typeKey ? String(t[typeKey]).toUpperCase() : 'EXPENSE',
          categoryId: categoryId,
          date: isoDate
        };
      })
      .filter(t => !isNaN(t.amount) && t.amount > 0); // Automatically drops any ₹0 or invalid rows

    const result = await prisma.transaction.createMany({
      data: formattedTransactions,
      skipDuplicates: true 
    });

    res.json({ message: "Import successful", count: result.count });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({ error: "Failed to import transactions" });
  }
});

module.exports = router;