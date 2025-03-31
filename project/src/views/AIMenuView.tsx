import React, { useEffect, useState } from "react";
import { Sparkles, ChefHat, AlertTriangle, RefreshCcw } from "lucide-react";

function MenuCard({ item }: { item: any }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${
      item.recommended ? "border-2 border-indigo-500" : ""
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.description}</p>
        </div>
        {item.recommended && (
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full flex items-center">
            <Sparkles size={14} className="mr-1" />
            Recommended
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients:</h4>
          <div className="flex flex-wrap gap-2">
            {item.ingredients.map((ingredient: string, index: number) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs ${
                  item.expiringIngredients.includes(ingredient)
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {ingredient}
                {item.expiringIngredients.includes(ingredient) && (
                  <AlertTriangle size={12} className="inline ml-1" />
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-xl font-bold">₹{item.finalPrice}</span>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Add to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function AIMenuView() {
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMenu = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/menu/"); // Adjust API URL as needed
      const data = await response.json();
      
      if (data.menu) {
        const formattedMenu = data.menu.map((dish: any) => ({
          id: dish.Dish_Name,
          name: dish.Dish_Name,
          description: "Delicious AI-curated recipe", // Placeholder, fetch real description if available
          price: `₹${dish.Final_Price}`,
          finalPrice: dish.Final_Price,
          ingredients: [], // Fetch actual ingredients if available
          expiringIngredients: dish.Earliest_Expiry ? ["Expiring Soon"] : [],
          recommended: dish.Profit_Margin === "30%", // High-margin dishes are recommended
        }));
        setMenu(formattedMenu);
      }
    } catch (err) {
      setError("Failed to fetch menu. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI-Generated Menu</h1>
          <p className="text-gray-500 mt-1">Suggestions based on inventory and popularity</p>
        </div>
        <button
          onClick={fetchMenu}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <RefreshCcw size={20} />
          <span>Regenerate</span>
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-center space-x-3">
        <ChefHat className="text-indigo-600" size={24} />
        <div>
          <h2 className="font-medium text-indigo-900">AI Recommendation</h2>
          <p className="text-sm text-indigo-700">
            Based on your current inventory and sales trends, these items are recommended for today's menu.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading menu...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default AIMenuView;
