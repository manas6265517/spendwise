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

module.exports = router;