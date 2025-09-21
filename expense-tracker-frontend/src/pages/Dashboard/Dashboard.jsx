import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
)

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [byCategory, setByCategory] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const o = await api.get('/analytics/overview')
        setOverview(o.data.data)

        const c = await api.get('/analytics/charts/spending-by-category')
        setByCategory(c.data.data)

        const r = await api.get('/expenses/recent?limit=5')
        setRecentExpenses(r.data.data)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  // Percentage change calculation
  const current = overview?.current_month_total || 0
  const previous = overview?.previous_month_total || 0
  let percentageChange = 0
  if (previous > 0) {
    percentageChange = (((current - previous) / previous) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 shadow rounded">
          <div className="text-sm">Current Month</div>
          <div className="text-xl font-bold">₹{current}</div>
          {percentageChange !== 0 && (
            <div
              className={`text-sm font-medium ${
                percentageChange < 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {percentageChange < 0 ? '⬇️' : '⬆️'} {Math.abs(percentageChange)}%
            </div>
          )}
        </div>
        <div className="bg-white p-4 shadow rounded">
          <div className="text-sm">Previous Month</div>
          <div className="text-xl font-bold">₹{previous}</div>
        </div>
        <div className="bg-white p-4 shadow rounded col-span-2">
          <div className="text-sm mb-2">Top 3 Categories</div>
          <ul className="text-sm list-disc ml-4">
            {overview?.top_categories?.slice(0, 3).map((t, i) => (
              <li key={i}>
                {t.name}: ₹{t.total}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="font-semibold mb-2">Recent Expenses</h3>
        <ul className="divide-y text-sm">
          {recentExpenses.map((exp, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>{exp.description}</span>
              <span className="font-medium">₹{exp.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="bg-white p-4 shadow rounded">
          <h3 className="font-semibold mb-2">
            Spending by Category (this month)
          </h3>
          <Pie
            data={{
              labels: byCategory.map((r) => r.name),
              datasets: [
                {
                  data: byCategory.map((r) => r.total),
                  backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                  ],
                },
              ],
            }}
          />
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-4 shadow rounded">
          <h3 className="font-semibold mb-2">
            Monthly Trends (last 12 months)
          </h3>
          <Bar
            data={{
              labels: overview?.monthly_labels || [],
              datasets: [
                {
                  label: 'Spending',
                  data: overview?.monthly_values || [],
                  backgroundColor: '#36A2EB',
                },
              ],
            }}
          />
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="font-semibold mb-2">
          Daily Spending (this month)
        </h3>
        <Line
          data={{
            labels: overview?.daily_labels || [],
            datasets: [
              {
                label: 'Daily Spending',
                data: overview?.daily_values || [],
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.3,
                fill: true,
              },
            ],
          }}
        />
      </div>
    </div>
  )
}
