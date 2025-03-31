import React from 'react';
import { TrendingUp, TrendingDown, Package, Clock, AlertTriangle } from 'lucide-react';

// Mock data - Replace with actual API calls
const stats = [
  {
    title: "Today's Revenue",
    value: "₹24,500",
    trend: 12.5,
    positive: true,
  },
  {
    title: "Total Orders",
    value: "156",
    trend: 8.2,
    positive: true,
  },
  {
    title: "Inventory Items",
    value: "89",
    trend: -2.4,
    positive: false,
  },
  {
    title: "Pending Orders",
    value: "23",
    trend: 0,
    positive: true,
  },
];

const expiringItems = [
  { name: "Tomatoes", quantity: "5 kg", expiresIn: "2 days" },
  { name: "Bread", quantity: "10 pcs", expiresIn: "1 day" },
  { name: "Milk", quantity: "8 L", expiresIn: "3 days" },
];

const recentOrders = [
  { id: "#ORD001", customer: "Table 5", items: "Vada Pav (2), Missal (1)", status: "Pending" },
  { id: "#ORD002", customer: "Table 8", items: "Missal (2)", status: "Completed" },
  { id: "#ORD003", customer: "Table 3", items: "Vada Pav (4)", status: "Processing" },
];

function StatCard({ title, value, trend, positive }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="flex items-center justify-between mt-2">
        <p className="text-2xl font-semibold">{value}</p>
        {trend !== 0 && (
          <div className={`flex items-center ${positive ? 'text-green-500' : 'text-red-500'}`}>
            {positive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Expiring Items</h2>
            <AlertTriangle className="text-yellow-500" />
          </div>
          <div className="divide-y">
            {expiringItems.map((item, index) => (
              <div key={index} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity}</p>
                </div>
                <span className="text-red-500 text-sm">Expires in {item.expiresIn}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            <Clock className="text-gray-400" />
          </div>
          <div className="divide-y">
            {recentOrders.map((order, index) => (
              <div key={index} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{order.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>  
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{order.items}</p>
                <p className="text-xs text-gray-400">{order.customer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;