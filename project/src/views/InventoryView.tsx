import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Trash2, Edit } from "lucide-react";

// API Endpoint
const API_URL = "http://localhost:8000/inventory/";

function InventoryView() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentItem, setCurrentItem] = useState<any>(null);

  interface InventoryItem {
    Item_ID: number;
    Item_Name: string;
    Category: string;
    Quantity: number;
    Unit: string;
    Price_per_Unit: number;
    Expiry_Date: string;
    Storage_Location: string;
    Detected_By_AI: boolean;
    Confidence_Score: number;
  }
  
  // Fetch inventory data
  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        setInventory(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch inventory data");
        setIsLoading(false);
      });
  }, []);

  // Add inventory item
  const addInventoryItem = async (newItem: InventoryItem) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setInventory([...inventory, newItem]); // Update UI
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to add item: " + (error as Error).message);
    }
  };

  const updateInventoryItem = async (itemId: number, updatedItem: Partial<InventoryItem>) => {
    try {
      const requestBody = JSON.stringify({
        Item_Name: updatedItem.Item_Name || "Unknown Item",
        Category: updatedItem.Category || "Uncategorized",
        Quantity: updatedItem.Quantity ?? 0, // Ensure Quantity is a number
        Unit: updatedItem.Unit || "pcs",
        Price_per_Unit: updatedItem.Price_per_Unit ?? 0.0, // Ensure it's a float
        Expiry_Date: updatedItem.Expiry_Date || "9999-12-31", // Default far future date
        Storage_Location: updatedItem.Storage_Location || "Unknown Location",
      });
  
      const response = await fetch(`http://localhost:8000/inventory/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });
  
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to update item: " + (error as Error).message);
    }
  };
  
  


  // Delete inventory item
  const deleteInventoryItem = async (itemId: number) => {
    try {
      const response = await fetch(`${API_URL}${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setInventory(inventory.filter(item => item.Item_ID !== itemId)); // Remove from UI
        
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to delete item: " + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex space-x-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search inventory..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-gray-600">Loading...</p>
        ) : error ? (
          <p className="p-6 text-center text-red-600">{error}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">Unit Price</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.Item_ID}>
                  <td className="px-6 py-4">{item.Item_Name}</td>
                  <td className="px-6 py-4">{item.Category}</td>
                  <td className="px-6 py-4">{item.Quantity} {item.Unit}</td>
                  <td className="px-6 py-4">₹{item.Price_per_Unit}/{item.Unit}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => {
                        setCurrentItem(item);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => deleteInventoryItem(item.Item_ID)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Inventory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Inventory Item</h2>
            <input type="text" placeholder="Item Name" className="border p-2 w-full mb-2" id="item_name" />
            <input type="text" placeholder="Category" className="border p-2 w-full mb-2" id="category" />
            <input type="number" placeholder="Quantity" className="border p-2 w-full mb-2" id="quantity" />
            <input type="text" placeholder="Unit" className="border p-2 w-full mb-2" id="unit" />
            <input type="number" placeholder="Price per Unit" className="border p-2 w-full mb-2" id="price_per_unit" />
            <input type="date" placeholder="Expiry Date" className="border p-2 w-full mb-2" id="expiry_date" />
            <input type="text" placeholder="Storage Location" className="border p-2 w-full mb-2" id="storage_location" />
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              onClick={() => {
                const newItem: InventoryItem = {
                  Item_ID: Date.now(), // Temporary unique ID (optional, might be set by backend)
                  Item_Name: (document.getElementById("item_name") as HTMLInputElement).value,
                  Category: (document.getElementById("category") as HTMLInputElement).value,
                  Quantity: parseInt((document.getElementById("quantity") as HTMLInputElement).value) || 0,
                  Unit: (document.getElementById("unit") as HTMLInputElement).value,
                  Price_per_Unit: parseFloat((document.getElementById("price_per_unit") as HTMLInputElement).value) || 0,
                  Expiry_Date: (document.getElementById("expiry_date") as HTMLInputElement).value,
                  Storage_Location: (document.getElementById("storage_location") as HTMLInputElement).value,
                  Detected_By_AI: false,
                  Confidence_Score: 0,
                };
                
                addInventoryItem(newItem);
                setIsAddModalOpen(false);
              }}
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Inventory Item</h2>
            <input type="text" defaultValue={currentItem?.Item_Name} className="border p-2 w-full mb-2" id="edit_item_name" />
            <input type="text" defaultValue={currentItem?.Category} className="border p-2 w-full mb-2" id="edit_category" />
            <input type="number" defaultValue={currentItem?.Quantity} className="border p-2 w-full mb-2" id="edit_quantity" />
            <input type="text" defaultValue={currentItem?.Unit} className="border p-2 w-full mb-2" id="edit_unit" />
            <input type="number" defaultValue={currentItem?.Price_per_Unit} className="border p-2 w-full mb-2" id="edit_price_per_unit" />
            <input type="date" defaultValue={currentItem?.Expiry_Date} className="border p-2 w-full mb-2" id="edit_expiry_date" />
            <input type="text" defaultValue={currentItem?.Storage_Location} className="border p-2 w-full mb-2" id="edit_storage_location" />
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              onClick={() => {
                const updatedItem: Partial<InventoryItem> = {
                  Item_Name: (document.getElementById("edit_item_name") as HTMLInputElement).value,
                  Category: (document.getElementById("edit_category") as HTMLInputElement).value,
                  Quantity: parseInt((document.getElementById("edit_quantity") as HTMLInputElement).value) || 0,
                  Unit: (document.getElementById("edit_unit") as HTMLInputElement).value,
                  Price_per_Unit: parseFloat((document.getElementById("edit_price_per_unit") as HTMLInputElement).value) || 0.0,
                  Expiry_Date: (document.getElementById("edit_expiry_date") as HTMLInputElement).value,
                  Storage_Location: (document.getElementById("edit_storage_location") as HTMLInputElement).value,
                };
                
                updateInventoryItem(currentItem.Item_ID, updatedItem);
                setIsEditModalOpen(false);
              }}
            >
              Update Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryView;
