// server.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5000;
const MONGO_URI = 'mongodb://localhost:27017/mern-challenge';

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Failed:', err));

// Define schema and model
const transactionSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  sold: Boolean,
  dateOfSale: Date,
  category: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// API to initialize database with seed data
app.get('/api/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transaction.deleteMany(); // Clear existing data
    await Transaction.insertMany(response.data); // Seed new data
    res.status(200).json({ message: 'Database initialized with seed data.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize database', details: error.message });
  }
});

// API to list transactions with search and pagination
app.get('/api/transactions', async (req, res) => {
  const { month, search = '', page = 1, perPage = 10 } = req.query;
  try {
    const query = {
      dateOfSale: { $regex: `-${month}-`, $options: 'i' },
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: { $regex: search, $options: 'i' } }
      ]
    };
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(Number(perPage));
    const total = await Transaction.countDocuments(query);
    res.status(200).json({ transactions, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
});

// API for statistics
app.get('/api/statistics', async (req, res) => {
  const { month } = req.query;
  try {
    const query = { dateOfSale: { $regex: `-${month}-`, $options: 'i' } };
    const totalSales = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const soldCount = await Transaction.countDocuments({ ...query, sold: true });
    const unsoldCount = await Transaction.countDocuments({ ...query, sold: false });
    res.status(200).json({
      totalSaleAmount: totalSales[0]?.total || 0,
      totalSoldItems: soldCount,
      totalNotSoldItems: unsoldCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

// API for bar chart data
app.get('/api/bar-chart', async (req, res) => {
  const { month } = req.query;
  try {
    const query = { dateOfSale: { $regex: `-${month}-`, $options: 'i' } };
    const priceRanges = [
      { range: '0-100', min: 0, max: 100 },
      { range: '101-200', min: 101, max: 200 },
      { range: '201-300', min: 201, max: 300 },
      { range: '301-400', min: 301, max: 400 },
      { range: '401-500', min: 401, max: 500 },
      { range: '501-600', min: 501, max: 600 },
      { range: '601-700', min: 601, max: 700 },
      { range: '701-800', min: 701, max: 800 },
      { range: '801-900', min: 801, max: 900 },
      { range: '901-above', min: 901 }
    ];

    const data = await Promise.all(priceRanges.map(async (range) => {
      const count = await Transaction.countDocuments({
        ...query,
        price: range.max ? { $gte: range.min, $lte: range.max } : { $gte: range.min }
      });
      return { range: range.range, count };
    }));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bar chart data', details: error.message });
  }
});

// API for pie chart data
app.get('/api/pie-chart', async (req, res) => {
  const { month } = req.query;
  try {
    const query = { dateOfSale: { $regex: `-${month}-`, $options: 'i' } };
    const categories = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.status(200).json(categories.map(c => ({ category: c._id, count: c.count })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pie chart data', details: error.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Note:
// This code only includes the backend implementation for the MERN challenge.
// You will need a frontend to interact with the APIs, especially for the table, dropdown, and charts described in the challenge.
