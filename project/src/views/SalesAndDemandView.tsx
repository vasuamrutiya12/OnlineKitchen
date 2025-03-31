import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const SalesAndDemandView = () => {
  const [days, setDays] = useState(2); // Default days for prediction
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchForecast = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://127.0.0.1:8000/forecast/${days}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const data = await response.json();
      setForecastData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Sales & Demand Prediction</h1>

      {/* Dropdown for selecting days */}
      <div className="flex items-center space-x-4">
        <label className="text-gray-700 font-medium">Select Days:</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-1 focus:ring focus:ring-blue-300"
        >
          {[1, 2, 3, 5, 7, 10, 15].map((d) => (
            <option key={d} value={d}>{d} Days</option>
          ))}
        </select>
        <button
          onClick={fetchForecast}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Fetch Data
        </button>
      </div>

      {loading && <p className="text-gray-700">Loading predictions...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {forecastData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demand Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecastData.map((item, index) => {
                const demandTrend = item.Predicted_Quantity > 10 ? "High Demand" : "Stable";
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.Date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.Item_Name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.Predicted_Quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          demandTrend === "High Demand" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {demandTrend} {demandTrend === "High Demand" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesAndDemandView;
