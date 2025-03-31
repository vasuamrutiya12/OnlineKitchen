// import React, { useState } from 'react';
import { Plus, Search, Sparkles, ChefHat, Book, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from "react";
// Mock data - Replace with actual API data
const recipes = [
  {
    id: 1,
    name: 'Classic Vada Pav',
    description: 'Mumbai\'s favorite street food',
    ingredients: [
      { name: 'Potato', quantity: '500g' },
      { name: 'Green Chili', quantity: '4-5 pcs' },
      { name: 'Pav Buns', quantity: '8 pcs' },
      { name: 'Garlic', quantity: '8-10 cloves' },
      { name: 'Ginger', quantity: '2 inch' }
    ],
    instructions: [
      'Boil and mash potatoes',
      'Make spice mixture with chilies and garlic',
      'Form potato patties',
      'Deep fry until golden brown',
      'Serve hot with pav and chutney'
    ],
    preparationTime: '45 mins',
    servings: 4,
    isAiGenerated: false
  },
  {
    id: 2,
    name: 'Spicy Missal',
    description: 'Traditional Maharashtrian dish',
    ingredients: [
      { name: 'Mixed Sprouts', quantity: '250g' },
      { name: 'Onion', quantity: '2 medium' },
      { name: 'Tomato', quantity: '2 medium' },
      { name: 'Farsan', quantity: '100g' }
    ],
    instructions: [
      'Pressure cook sprouts',
      'Prepare spicy gravy base',
      'Mix sprouts with gravy',
      'Top with farsan and serve'
    ],
    preparationTime: '60 mins',
    servings: 3,
    isAiGenerated: false
  }
];

function AddRecipeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    Dish_Name: "",
    Ingredients: [{ name: "", quantity: "" }],
    Prep_Time: "",
    price: "",
    Calories: "",
    Recipe_ID: "",
    Cooking_Time: ""
  });

  const [message, setMessage] = useState(""); // Success/Error message

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Ingredient Changes
  const handleIngredientChange = (index: number, field: string, value: string) => {
    const updatedIngredients = [...formData.Ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      Ingredients: updatedIngredients,
    }));
  };

  // Add New Ingredient Field
  const addIngredientField = () => {
    setFormData((prev) => ({
      ...prev,
      Ingredients: [...prev.Ingredients, { name: "", quantity: "" }]
    }));
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Convert Ingredients array to an object
  const ingredientsObject = formData.Ingredients.reduce((acc, ing) => {
    acc[ing.name] = ing.quantity;
    return acc;
  }, {});

  // Construct the payload with the correct structure
  const payload = {
    Dish_Name: formData.Dish_Name,
    Ingredients: ingredientsObject, // Convert array to object
    Prep_Time: parseInt(formData.Prep_Time, 10),
    Cooking_Time: parseInt(formData.Cooking_Time, 10),
    price: parseFloat(formData.price),
    Calories: parseFloat(formData.Calories),
    Recipe_ID: parseInt(formData.Recipe_ID, 10),
  };

  try {
    const response = await fetch("http://localhost:8000/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setMessage("Recipe added successfully!");
      // Reset form data
      setFormData({
        Dish_Name: "",
        Ingredients: [{ name: "", quantity: "" }],
        Prep_Time: "",
        Cooking_Time: "",
        price: "",
        Calories: "",
        Recipe_ID: ""
      });
    } else {
      const errorData = await response.json();
      setMessage(`Failed to add recipe: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error("Error:", error);
    setMessage("An error occurred while saving the recipe.");
  }
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add New Recipe</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ❌
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dish Name</label>
            <input
              type="text"
              name="Dish_Name"
              value={formData.Dish_Name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Ingredients</label>
            {formData.Ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Ingredient Name"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                  required
                  className="flex-1 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Quantity"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                  required
                  className="w-32 border border-gray-300 rounded-md"
                />
              </div>
            ))}
            <button type="button" onClick={addIngredientField} className="mt-2 text-blue-600">
              + Add Ingredient
            </button>
          </div>

          {/* Other Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prep Time (mins)</label>
              <input
                type="number"
                name="Prep_Time"
                value={formData.Prep_Time}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cooking Time (mins)</label>
              <input
                type="number"
                name="Cooking_Time"
                value={formData.Cooking_Time}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Calories</label>
              <input
                type="number"
                name="Calories"
                value={formData.Calories}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">
              Save Recipe
            </button>
          </div>

          {/* Success/Error Message */}
          {message && (
            <p className={`mt-4 text-center ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
function RecipeCard({ recipe }: { recipe: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{recipe.name}</h3>
          <p className="text-sm text-gray-500">{recipe.description}</p>
        </div>
        {recipe.isAiGenerated && (
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full flex items-center">
            <Sparkles size={14} className="mr-1" />
            AI Generated
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Quick Info:</h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-indigo-600 text-sm hover:text-indigo-800"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          </div>
          <div className="flex space-x-4 text-sm text-gray-600">
            <span>🕒 {recipe.preparationTime}</span>
            <span>👥 Serves {recipe.servings}</span>
          </div>
        </div>

        {isExpanded && (
          <>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {recipe.ingredients.map((ingredient: any, index: number) => (
                  <li key={index}>
                    {ingredient.name} - {ingredient.quantity}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {recipe.instructions.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <button className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm">
            Edit
          </button>
          <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerateRecipeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Generate AI Recipe</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ChefHat className="text-indigo-600" size={24} />
              <div>
                <h3 className="font-medium text-indigo-900">AI Recipe Generation</h3>
                <p className="text-sm text-indigo-700">
                  Our AI will create a recipe based on your available ingredients and preferences.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Main Ingredients
            </label>
            <select
              multiple
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              size={5}
            >
              <option value="potato">Potato (50 kg available)</option>
              <option value="onion">Onion (30 kg available)</option>
              <option value="tomato">Tomato (20 kg available)</option>
              <option value="pav">Pav (200 pcs available)</option>
              <option value="spices">Mixed Spices (5 kg available)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Type
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option>Any</option>
              <option>Main Course</option>
              <option>Snack</option>
              <option>Street Food Style</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preparation Time
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option>Any</option>
              <option>Quick (under 30 mins)</option>
              <option>Medium (30-60 mins)</option>
              <option>Long (60+ mins)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Sparkles size={16} />
              <span>Generate Recipe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// import React, { useState, useEffect } from "react";
// import { Plus, Sparkles } from "lucide-react";
// import AddRecipeModal from "./AddRecipeModal";

function RecipeView() {
  console.log("🔄 RecipeView component rendering...");

  const [recipes, setRecipes] = useState([]); // Fetched recipes
  const [generatedRecipes, setGeneratedRecipes] = useState([]); // AI-generated recipes
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch Recipes from Database
  const fetchRecipes = async () => {
    console.log("📡 Fetching recipes from API...");

    try {
      const response = await fetch("http://localhost:8000/recipe/");
      console.log("📥 API Response Status:", response.status);

      if (!response.ok) throw new Error(`❌ Failed to fetch recipes: ${response.statusText}`);

      const data = await response.json();
      console.log("✅ Fetched Recipes:", data);

      if (!Array.isArray(data)) {
        console.error("🚨 API response is not an array!", data);
        return;
      }

      setRecipes(data);
    } catch (error) {
      console.error("❌ Error fetching recipes:", error);
    }
  };

  // Fetch Generated Recipes from Backend
  const generateRecipes = async () => {
    console.log("✨ Fetching generated recipes from API...");

    try {
      const response = await fetch("http://localhost:8000/generate-dishes");
      console.log("📥 API Response Status:", response.status);

      if (!response.ok) throw new Error(`❌ Failed to generate recipes: ${response.statusText}`);

      const data = await response.json();
      console.log("✅ Generated Dishes:", data);

      if (!data?.suggested_dishes || !Array.isArray(data.suggested_dishes)) {
        console.error("🚨 API response is not in expected format!", data);
        return;
      }

      setGeneratedRecipes(data.suggested_dishes);
    } catch (error) {
      console.error("❌ Error generating recipes:", error);
    }
  };

  // Fetch recipes when component mounts
  useEffect(() => {
    console.log("🔄 useEffect triggered! Fetching recipes...");
    fetchRecipes();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🍽️ Recipe List</h1>
        <div className="flex gap-4">
          <button
            onClick={generateRecipes}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Sparkles size={20} className="mr-2" />
            Generate Recipes
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Add Recipe
          </button>
        </div>
      </div>

      {/* Recipe Grid (Fetched Recipes) */}
      <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">✅ Saved Recipes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.length > 0 ? (
          recipes.map((recipe, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <span className="text-green-600 text-sm font-semibold">✅ From Database</span>
              <h2 className="text-xl font-semibold text-gray-900">{recipe?.Dish_Name || "Unnamed Dish"}</h2>
              <p className="text-gray-600 mt-1">🔥 Calories: {recipe?.Calories || "N/A"} kcal</p>
              <p className="text-gray-600">⏳ Prep Time: {recipe?.Prep_Time} mins | 🍳 Cooking Time: {recipe?.Cooking_Time} mins</p>

              <h3 className="text-lg font-medium text-gray-800 mt-3">🛒 Ingredients:</h3>
              <ul className="list-disc list-inside text-gray-700">
                {recipe?.Ingredients &&
                  Object.entries(recipe?.Ingredients).map(([key, value], idx) => (
                    <li key={idx} className="ml-2">
                      {key}: {value}
                    </li>
                  ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No recipes found.</p>
        )}
      </div>

      {/* Generated Recipes Grid */}
      {generatedRecipes.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">✨ AI Generated Recipes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedRecipes.map((recipe, index) => (
              <div key={index} className="bg-blue-100 rounded-lg shadow-md p-4 border border-blue-300">
                <span className="text-blue-600 text-sm font-semibold">✨ AI Suggested</span>
                <h2 className="text-xl font-semibold text-gray-900">{recipe?.Dish_Name || "Unnamed Dish"}</h2>
                <p className="text-gray-600 mt-1">🔥 Calories: {recipe?.Calories || "N/A"} kcal</p>
                <p className="text-gray-600">⏳ Prep Time: {recipe?.Prep_Time} mins | 🍳 Cooking Time: {recipe?.Cooking_Time} mins</p>

                <h3 className="text-lg font-medium text-gray-800 mt-3">🛒 Ingredients:</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {recipe?.Ingredients &&
                    Object.entries(recipe?.Ingredients).map(([key, value], idx) => (
                      <li key={idx} className="ml-2">
                        {key}: {value}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Recipe Modal */}
      {isAddModalOpen && (
        <AddRecipeModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            fetchRecipes(); // Refresh recipes after adding
          }}
        />
      )}
    </div>
  );
}

export default RecipeView;

// export default RecipeView; 