import React, { useEffect, useState } from "react";
import { Filter, Search, Clock, CheckCircle, XCircle, PlusCircle } from "lucide-react";

const API_URL = "http://localhost:8000/customer-order/";

function OrderCard({ order }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">#ORD{order.Order_ID}</h3>
          <p className="text-sm text-gray-500">Customer ID: {order.Customer_ID}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.Order_Status === "Completed"
              ? "bg-green-100 text-green-800"
              : order.Order_Status === "Processing"
              ? "bg-blue-100 text-blue-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {order.Order_Status}
        </span>
      </div>

      <div className="space-y-2">
        {Object.entries(order.Items_Ordered || {}).map(([name, quantity], index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {quantity}x {name}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{order.Total_Bill}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center text-sm text-gray-500">
          <Clock size={16} className="mr-1" />
          {new Date(order.Date_Time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div className="flex space-x-2">
          <button className="p-2 text-green-600 hover:bg-green-50 rounded-full">
            <CheckCircle size={20} />
          </button>
          <button className="p-2 text-red-600 hover:bg-red-50 rounded-full">
            <XCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All Orders");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newOrder, setNewOrder] = useState({
    Customer_ID: "",
    Items_Ordered: { "Item_1": { name: "Item_1", quantity: 0 } },
    Total_Bill: 0,
    Order_Status: "Pending",
    Date_Time: new Date().toISOString(), // Automatically set system date and time
  });
  const [responseMessage, setResponseMessage] = useState("");
  const [responseColor, setResponseColor] = useState("");

  // Fetch Orders from API
  const fetchOrders = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("Invalid response format:", data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const addNewOrder = async () => {
    try {
      console.log("🛠️ Debug: New Order Before Formatting", JSON.stringify(newOrder, null, 2));
  
      if (!newOrder.Items_Ordered || Object.keys(newOrder.Items_Ordered).length === 0) {
        console.error("🚨 Error: Items_Ordered is empty before formatting!");
        setResponseMessage("❌ No items selected.");
        setResponseColor("red");
        return;
      }
  
      // Format Items_Ordered
      const formattedItems = Object.entries(newOrder.Items_Ordered).reduce((acc, [key, item]) => {
        if (typeof item === "object" && item.name && item.quantity > 0) {
          acc[item.name] = Number(item.quantity);
        } else if (typeof item === "number") {
          acc[key] = Number(item);
        } else {
          console.warn(`⚠️ Skipping invalid item: ${JSON.stringify(item)}`);
        }
        return acc;
      }, {} as Record<string, number>);
  
      console.log("✅ Debug: Formatted Items_Ordered", JSON.stringify(formattedItems, null, 2));
  
      if (Object.keys(formattedItems).length === 0) {
        console.error("🚨 Error: Formatted Items_Ordered is still empty!");
        setResponseMessage("❌ No valid items found.");
        setResponseColor("red");
        return;
      }
  
      // Construct final order object
      const formattedOrder = {
        Customer_ID: Number(newOrder.Customer_ID),
        Date_Time: newOrder.Date_Time,
        Items_Ordered: formattedItems,
        Total_Bill: Number(newOrder.Total_Bill),
        Order_Status: newOrder.Order_Status,
      };
  
      console.log("✅ Debug: Final Order Before Sending", JSON.stringify(formattedOrder, null, 2));
  
      // Send request to backend
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedOrder),
      });
  
      console.log("📡 Debug: API Response Status", response.status);
  
      const data = await response.json();
      console.log("📩 Debug: API Response", data);
  
      // ✅ **Fix: Check for success message instead of `Order_ID`**
      if (response.ok && data?.message?.includes("Order placed")) {
        console.log("✅ Order placed successfully!");
        setResponseMessage("✅ Order successfully added!");
        setResponseColor("green");
        fetchOrders(); // Refresh order list
      } else {
        console.error("🚨 Unexpected response:", data);
        setResponseMessage(`❌ Failed to add order: ${data?.message || "Unknown error"}`);
        setResponseColor("red");
      }
    } catch (error) {
      console.error("❌ Error adding new order:", error);
      setResponseMessage("❌ Failed to add order due to an error.");
      setResponseColor("red");
    }
  };
  
  

  // Handle input change for Customer ID, Total Bill, and Order Status
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder((prevOrder) => ({
      ...prevOrder,
      [name]: value,
    }));
  };

  const handleItemChange = (e, itemName) => {
    const { value } = e.target;
    setNewOrder((prevOrder) => {
      let updatedItems = { ...prevOrder.Items_Ordered };
      const quantity = updatedItems[itemName]?.quantity || 0; // Preserve quantity
      delete updatedItems[itemName]; // Remove old key
      updatedItems[value] = { name: value, quantity }; // Add new key with correct data
      return { ...prevOrder, Items_Ordered: updatedItems };
    });
  };
  
  

  const handleItemQuantityChange = (e, itemName) => {
    const { value } = e.target;
    setNewOrder((prevOrder) => ({
      ...prevOrder,
      Items_Ordered: {
        ...prevOrder.Items_Ordered,
        [itemName]: parseInt(value) || 0,  // ✅ Now stores correct quantity format
      },
    }));
  };
  

  const addNewItemField = () => {
    const itemCount = Object.keys(newOrder.Items_Ordered).length + 1;
    setNewOrder((prevOrder) => ({
      ...prevOrder,
      Items_Ordered: {
        ...prevOrder.Items_Ordered,
        [`Item_${itemCount}`]: { name: `Item_${itemCount}`, quantity: 0 },
      },
    }));
  };

  const removeItemField = (itemName) => {
    const updatedItems = { ...newOrder.Items_Ordered };
    delete updatedItems[itemName];
    setNewOrder((prevOrder) => ({
      ...prevOrder,
      Items_Ordered: updatedItems,
    }));
  };

  // Run fetchOrders when component loads
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter & Search Orders
  const filteredOrders = orders.filter(
    (order) =>
      order?.Order_ID &&
      (filter === "All Orders" || order.Order_Status === filter) &&
      (order.Order_ID.toString().includes(searchTerm) ||
        JSON.stringify(order.Items_Ordered || {})
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>
        <button
          onClick={() => setIsFormVisible(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <PlusCircle size={20} />
          <span>New Order</span>
        </button>
      </div>

      {/* Response Message */}
      {responseMessage && (
        <div
          className={`p-4 rounded-lg text-white ${responseColor === "green" ? "bg-green-600" : "bg-red-600"}`}
        >
          {responseMessage}
        </div>
      )}

      {/* New Order Form */}
      {isFormVisible && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">New Order</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Customer ID</label>
              <input
                type="number"
                name="Customer_ID"
                value={newOrder.Customer_ID}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>

            {Object.entries(newOrder.Items_Ordered).map(([itemName, item], index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">Item Name</label>
                  <input
                    type="text"
                    name="name"
                    value={item.name}
                    onChange={(e) => handleItemChange(e, itemName)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemQuantityChange(e, itemName)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItemField(itemName)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-full"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addNewItemField}
              className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
            >
              <PlusCircle size={20} />
            </button>

            <div>
              <label className="block text-sm font-medium">Total Bill</label>
              <input
                type="number"
                name="Total_Bill"
                value={newOrder.Total_Bill}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Order Status</label>
              <select
                name="Order_Status"
                value={newOrder.Order_Status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              >
                <option>Pending</option>
                <option>Processing</option>
                <option>Completed</option>
              </select>
            </div>

            {/* Date and Time (Auto-filled with current system date) */}
            <div>
              <label className="block text-sm font-medium">Date and Time</label>
              <input
                type="text"
                name="Date_Time"
                value={newOrder.Date_Time}
                readOnly
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setIsFormVisible(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addNewOrder}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Submit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex space-x-4 items-center">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-white pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option>All Orders</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Completed</option>
          </select>
          <Filter
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </div>

      {/* Order Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <OrderCard key={order.Order_ID} order={order} />
        ))}
      </div>
    </div>
  );
}

export default OrdersView;
