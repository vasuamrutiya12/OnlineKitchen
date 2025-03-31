import React, { useState } from "react";
import { Upload, Check, X, Image as ImageIcon } from "lucide-react";

function FoodAnalysisView() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ name: string; quantity: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError(null);
    setUploadedImage(URL.createObjectURL(file));
    setLoading(true);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/analyze-food", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze image.");
      }

      const data = await response.json();
      if (data.food_items) {
        const foodArray = Object.entries(data.food_items).map(([name, quantity]) => ({
          name,
          quantity,
        }));
        setAnalysis(foodArray);
      }
    } catch (error: any) {
      console.error("Error analyzing food:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Food Analysis</h1>
          <p className="text-gray-500 mt-1">Upload food images for AI analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-500"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadedImage ? (
              <div className="space-y-4">
                <img src={uploadedImage} alt="Uploaded food" className="max-h-64 mx-auto rounded-lg" />
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setAnalysis(null);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center justify-center space-x-1"
                >
                  <X size={16} />
                  <span>Remove Image</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <ImageIcon size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700">Drag and drop your image here, or</p>
                  <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
                    <Upload size={20} className="mr-2" />
                    <span>Choose File</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileInput} />
                  </label>
                </div>
                <p className="text-sm text-gray-500">Supports: JPG, PNG (Max 5MB)</p>
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Analyzing image...</p>
            </div>
          )}

          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>

        {analysis && analysis.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Analysis Results</h2>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Detected Items:</h3>
                <div className="space-y-2">
                  {analysis.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({item.quantity})</span>
                      </div>
                      <span className="text-green-600 flex items-center">
                        <Check size={16} className="mr-1" />
                        AI Detected
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodAnalysisView;
