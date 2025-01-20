import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';

const App = () => {
  const [month, setMonth] = useState('03'); // Default March
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarChartData();
    fetchPieChartData();
  }, [month]);

  const fetchTransactions = async () => {
    const res = await axios.get(`/api/transactions`, { params: { month } });
    setTransactions(res.data.transactions);
  };

  const fetchStatistics = async () => {
    const res = await axios.get(`/api/statistics`, { params: { month } });
    setStatistics(res.data);
  };

  const fetchBarChartData = async () => {
    const res = await axios.get(`/api/bar-chart`, { params: { month } });
    setBarChartData(res.data);
  };

  const fetchPieChartData = async () => {
    const res = await axios.get(`/api/pie-chart`, { params: { month } });
    setPieChartData(res.data);
  };

  return (
    <div>
      <h1>Transactions Dashboard</h1>
      <select value={month} onChange={(e) => setMonth(e.target.value)}>
        {[...Array(12).keys()].map((m) => (
          <option key={m} value={String(m + 1).padStart(2, '0')}>
            {new Date(0, m).toLocaleString('default', { month: 'long' })}
          </option>
        ))}
      </select>

      <div>
        <h2>Transactions</h2>
        <ul>
          {transactions.map((t) => (
            <li key={t._id}>{t.title}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Statistics</h2>
        <p>Total Sale: {statistics.totalSaleAmount}</p>
        <p>Sold Items: {statistics.totalSoldItems}</p>
        <p>Not Sold Items: {statistics.totalNotSoldItems}</p>
      </div>

      <div>
        <h2>Bar Chart</h2>
        <Bar
          data={{
            labels: barChartData.map((b) => b.range),
            datasets: [
              {
                label: 'Items',
                data: barChartData.map((b) => b.count),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
              },
            ],
          }}
        />
      </div>

      <div>
        <h2>Pie Chart</h2>
        <Pie
          data={{
            labels: pieChartData.map((p) => p.category),
            datasets: [
              {
                data: pieChartData.map((p) => p.count),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default App;
