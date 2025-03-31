from fastapi import FastAPI, Depends, File, UploadFile, HTTPException, Query
import google.generativeai as genai
from pydantic import BaseModel, Field
from PIL import Image
import io
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
import re
from database import SessionLocal, engine
import pandas as pd
from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMA
from xgboost import XGBRegressor
import numpy as np
import json
from typing import Dict, Union
from models import DailyActivity  # Add this line
from models import InventoryItem
import requests
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse



models.Base.metadata.create_all(bind=engine)

# ===========================
# CONFIGURE GEMINI API
# ===========================
GEMINI_API_KEY = "gemini-key"  # Replace with a secure method
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ Pydantic Model for Inventory
class InventoryItemRequest(BaseModel):
    Item_Name: str
    Category: str
    Quantity: float
    Unit: str
    Price_per_Unit: float
    Expiry_Date: datetime  # ✅ Use datetime for better handling
    Storage_Location: str
    Detected_By_AI: bool
    Confidence_Score: float

class InventoryItem(BaseModel):
    Item_Name: str = Field(default="Unknown Item")
    Category: str = Field(default="Uncategorized")
    Quantity: int = Field(default=0, ge=0)  # Ensure non-negative values
    Unit: str = Field(default="pcs")
    Price_per_Unit: float = Field(default=0.0, ge=0.0)  # Ensure non-negative
    Expiry_Date: str = Field(default="9999-12-31")  # Default future expiry
    Storage_Location: str = Field(default="Unknown Location")


# ✅ Pydantic Model for Daily Activity
class DailyActivityRequest(BaseModel):
    Date_Time: datetime  # ✅ Use datetime
    Item_Name: str
    Quantity_Sold: int
    Revenue: float
    Customer_Count: int
    Weather_Condition: str | None = None  # ✅ Optional field
    Day_Type: str  # Weekday, Weekend, Holiday

# ✅ Pydantic Model for Customer Order
class CustomerOrderRequest(BaseModel):
    Customer_ID: int
    Date_Time: datetime  # ✅ Use datetime
    Items_Ordered: dict
    Total_Bill: float
    Order_Status: str

class RecipeRequest(BaseModel):
    Dish_Name: str
    Ingredients: dict
    Calories: float
    Prep_Time: int
    Cooking_Time: int
    price: float  # Changed to lowercase


# ===========================
# GENERATE DISHES BASED ON INVENTORY
# ===========================
@app.get("/generate-dishes/")
def generate_dishes(db: Session = Depends(get_db)):
    # Fetch available inventory
    inventory_items = db.query(models.InventoryItem).all()
    
    if not inventory_items:
        return {"message": "No ingredients available in inventory."}

    # Prepare ingredient list
    ingredients_list = [
        f"{item.Item_Name} ({item.Quantity})" for item in inventory_items
    ]
    ingredients_text = ", ".join(ingredients_list)

    # Use Gemini API to generate new dishes
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""
    You are a recipe generator. Create 3 unique dishes using only these available ingredients: {ingredients_text}.
    
    Respond **only** with a valid JSON array of dishes, following this format:
    
    [
      {{
        "Dish_Name": "Dish Name",
        "Ingredients": {{
          "Ingredient1": "Quantity",
          "Ingredient2": "Quantity"
        }},
        "Prep_Time": 5,
        "Cooking_Time": 3,
        "Calories": 250.0
      }},
      ...
    ]
    """

    response = model.generate_content(prompt)

    # Debug: Print raw response from Gemini
    raw_text = response.text

    # ✅ Remove markdown code blocks (```json ... ```)
    cleaned_json_text = re.sub(r"```json\n|\n```", "", raw_text).strip()

    # ✅ Convert string to JSON
    try:
        dishes = json.loads(cleaned_json_text)
    except json.JSONDecodeError:
        return {"message": "Invalid JSON response from Gemini AI."}

    # ✅ Return ALL dishes in Postman
    return {"suggested_dishes": dishes}


    
@app.post("/inventory/")
def add_inventory(item: InventoryItemRequest, db: Session = Depends(get_db)):
    # ✅ No need to convert Expiry_Date again
    expiry_date = item.Expiry_Date

    # ✅ Check if the same item exists with the same expiry date
    existing_item = (
        db.query(models.InventoryItem)
        .filter(
            models.InventoryItem.Item_Name == item.Item_Name,
            models.InventoryItem.Expiry_Date == expiry_date
        )
        .first()
    )

    if existing_item:
        # ✅ If same expiry date → Update quantity
        existing_item.Quantity += item.Quantity
        existing_item.Price_per_Unit = item.Price_per_Unit  # Optional: Update price
        existing_item.Storage_Location = item.Storage_Location  # Optional update
        db.commit()
        return {"message": f"Updated existing inventory for '{item.Item_Name}', new quantity: {existing_item.Quantity}, expiry: {expiry_date}"}
    
    # ✅ If expiry date is different → Insert as a new entry
    new_item = models.InventoryItem(
        Item_Name=item.Item_Name,
        Category=item.Category,
        Quantity=item.Quantity,
        Unit=item.Unit,
        Price_per_Unit=item.Price_per_Unit,
        Expiry_Date=expiry_date,  # ✅ No conversion needed
        Storage_Location=item.Storage_Location,
        Detected_By_AI=item.Detected_By_AI,
        Confidence_Score=item.Confidence_Score
    )

    db.add(new_item)
    db.commit()
    return {"message": f"New inventory item '{item.Item_Name}' added with expiry {expiry_date}!"}

# ✅ Get All Inventory Items
@app.get("/inventory/")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.InventoryItem).all()

@app.put("/inventory/{item_id}")
def update_inventory(item_id: int, item: InventoryItem, db: Session = Depends(get_db)):
    inventory_item = db.query(models.InventoryItem).filter(models.InventoryItem.Item_ID == item_id).first()
    if not inventory_item:
        return JSONResponse(status_code=404, content={"message": "Item not found"})

    inventory_item.Item_Name = item.Item_Name
    inventory_item.Category = item.Category
    inventory_item.Quantity = item.Quantity
    inventory_item.Unit = item.Unit
    inventory_item.Price_per_Unit = item.Price_per_Unit
    inventory_item.Expiry_Date = item.Expiry_Date
    inventory_item.Storage_Location = item.Storage_Location
    
    db.commit()
    return JSONResponse(status_code=200, content={"message": f"Inventory item '{item.Item_Name}' updated successfully!"})

@app.delete("/inventory/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db)):
    inventory_item = db.query(models.InventoryItem).filter(models.InventoryItem.Item_ID == item_id).first()
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(inventory_item)
    db.commit()
    return {"message": f"Inventory item '{inventory_item.Item_Name}' deleted successfully!"}


# ✅ Add Daily Activity Entry
@app.post("/daily-activity/")
def add_daily_activity(activity: DailyActivityRequest, db: Session = Depends(get_db)):
    date_time = datetime.strptime(activity.Date_Time, "%Y-%m-%d %H:%M")
    new_activity = models.DailyActivity(
        Date_Time=date_time,
        Item_Name=activity.Item_Name,
        Quantity_Sold=activity.Quantity_Sold,
        Revenue=activity.Revenue,
        Customer_Count=activity.Customer_Count,
        Weather_Condition=activity.Weather_Condition,
        Day_Type=activity.Day_Type
    )
    db.add(new_activity)
    db.commit()
    return {"message": "Daily activity recorded successfully!", "timestamp": date_time}

def extract_numeric_value(quantity_str):
    """Extracts the numeric part of a quantity string (e.g., '100g' -> 100.0)."""
    match = re.match(r"([\d.]+)", str(quantity_str))  # Ensure it's a string before regex
    return float(match.group(1)) if match else None

@app.post("/customer-order/")
def add_customer_order(order: CustomerOrderRequest, db: Session = Depends(get_db)):
    date_time = order.Date_Time  # ✅ Already a datetime object, no need for strptime()

    # ✅ Insert Order into `customer_order`
    new_order = models.CustomerOrder(
        Customer_ID=order.Customer_ID,
        Date_Time=date_time,
        Items_Ordered=order.Items_Ordered,
        Total_Bill=order.Total_Bill,
        Order_Status=order.Order_Status
    )
    db.add(new_order)

    # ✅ Extract Daily Activity Details & Deduct Ingredients
    for dish_name, quantity_ordered in order.Items_Ordered.items():
        # Fetch recipe details
        recipe = db.query(models.Recipe).filter(models.Recipe.Dish_Name == dish_name).first()
        if not recipe:
            return {"error": f"Recipe for '{dish_name}' not found"}

        for ingredient, required_quantity in recipe.Ingredients.items():
            numeric_required_quantity = extract_numeric_value(required_quantity)
            if numeric_required_quantity is None:
                return {"error": f"Invalid quantity format for ingredient '{ingredient}'"}

            required_total = numeric_required_quantity * int(quantity_ordered)

            # ✅ Fetch inventory items sorted by expiry date (FIFO)
            inventory_items = (
                db.query(models.InventoryItem)
                .filter(models.InventoryItem.Item_Name == ingredient)
                .order_by(models.InventoryItem.Expiry_Date)  # ✅ Oldest expiry first
                .all()
            )

            if not inventory_items:
                return {"error": f"Ingredient '{ingredient}' not found in inventory"}

            remaining_needed = required_total  # Track how much still needs to be deducted

            for inventory_item in inventory_items:
                current_quantity = extract_numeric_value(inventory_item.Quantity)

                if current_quantity is None:
                    return {"error": f"Invalid inventory format for ingredient '{ingredient}'"}

                if current_quantity >= remaining_needed:
                    inventory_item.Quantity = current_quantity - remaining_needed
                    remaining_needed = 0  # ✅ Fully deducted
                    break  # Stop checking further stocks
                else:
                    remaining_needed -= current_quantity
                    inventory_item.Quantity = 0  # ✅ Use up this stock

            if remaining_needed > 0:
                return {"error": f"Insufficient stock for ingredient '{ingredient}' (Needed: {required_total}, Available: {required_total - remaining_needed})"}

        # ✅ Log Daily Activity
        new_activity = models.DailyActivity(
            Date_Time=date_time,
            Item_Name=dish_name,
            Quantity_Sold=quantity_ordered,
            Revenue=order.Total_Bill,
            Customer_Count=1,
            Weather_Condition=None,
            Day_Type=get_day_type(date_time)
        )
        db.add(new_activity)

    db.commit()
    return {"message": "Order placed, ingredients deducted using FIFO, and daily activity recorded successfully!", "timestamp": date_time}



def get_day_type(date_time):
    """Helper function to determine if the day is a weekday, weekend, or holiday"""
    weekday = date_time.weekday()
    return "Weekend" if weekday >= 5 else "Weekday"


# ✅ Get All Customer Orders
@app.get("/customer-order/")
def get_customer_orders(db: Session = Depends(get_db)):
    return db.query(models.CustomerOrder).all()

# ✅ Get All Daily Activities
@app.get("/daily-activity/")
def get_daily_activity(db: Session = Depends(get_db)):
    return db.query(models.DailyActivity).all()

# ✅ Add Recipe
@app.post("/recipe/")
def add_recipe(recipe: RecipeRequest, db: Session = Depends(get_db)):
    new_recipe = models.Recipe(
        Dish_Name=recipe.Dish_Name,
        Ingredients=recipe.Ingredients,
        Calories=recipe.Calories,
        Prep_Time=recipe.Prep_Time,
        Cooking_Time=recipe.Cooking_Time,
        price=recipe.price if recipe.price is not None else 0.0  # ✅ Default to 0.0
    )
    db.add(new_recipe)
    db.commit()
    return {"message": "Recipe added successfully!"}


# ✅ Get All Recipes
@app.get("/recipe/")
def get_recipes(db: Session = Depends(get_db)):
    return db.query(models.Recipe).all()

def extract_numeric_value(value):
    """Ensure the value is a string before applying regex."""
    value = str(value)  # Convert to string before regex
    match = re.match(r"(\d+\.?\d*)", value)
    return float(match.group(1)) if match else None

from datetime import datetime, timedelta

@app.get("/menu/")
def get_available_menu(db: Session = Depends(get_db)):
    available_dishes = []

    # ✅ Fetch all recipes
    recipes = db.query(models.Recipe).all()
    dish_expiry_mapping = []  # Store dishes with expiry date & pricing info

    for recipe in recipes:
        all_ingredients_available = True  # ✅ Can we make this dish?
        earliest_expiry_date = None  # Track the earliest expiry date among ingredients
        total_cost = 0  # Track total cost to make the dish

        for ingredient, required_quantity in recipe.Ingredients.items():
            numeric_required_quantity = extract_numeric_value(str(required_quantity))
            if numeric_required_quantity is None:
                all_ingredients_available = False
                break  # Skip this dish if an ingredient has an invalid format

            # ✅ Fetch inventory items sorted by expiry date (FIFO)
            inventory_items = (
                db.query(models.InventoryItem)
                .filter(models.InventoryItem.Item_Name == ingredient)
                .order_by(models.InventoryItem.Expiry_Date)  # ✅ Oldest expiry first
                .all()
            )

            if not inventory_items:
                all_ingredients_available = False
                break  # Skip this dish if an ingredient is missing

            remaining_needed = numeric_required_quantity  # Track needed quantity

            for inventory_item in inventory_items:
                current_quantity = extract_numeric_value(str(inventory_item.Quantity))
                if current_quantity is None:
                    all_ingredients_available = False
                    break  # Skip if inventory data is invalid

                # ✅ Track soonest expiring ingredient
                if earliest_expiry_date is None or inventory_item.Expiry_Date < earliest_expiry_date:
                    earliest_expiry_date = inventory_item.Expiry_Date  

                # ✅ Proper Cost Calculation
                if remaining_needed > 0:
                    used_quantity = min(remaining_needed, current_quantity)  # Use available stock
                    cost = (used_quantity * inventory_item.Price_per_Unit)  # Correct cost formula
                    total_cost += cost
                    remaining_needed -= used_quantity  # Deduct from needed amount

                if remaining_needed == 0:
                    break  # ✅ Fully satisfied, no need to check more inventory

            if remaining_needed > 0:
                all_ingredients_available = False
                break  # Not enough stock to make this dish

        if all_ingredients_available:
            # ✅ Calculate profit margin based on expiry date
            days_until_expiry = (earliest_expiry_date - datetime.now()).days if earliest_expiry_date else float("inf")
            
            if days_until_expiry <= 3:
                profit_margin = 0.2  # 20% for expiry within 3 days
            elif 4 <= days_until_expiry <= 5:
                profit_margin = 0.25  # 25% for expiry within 4-5 days
            else:
                profit_margin = 0.3  # 30%+ for more than 5 days
            
            final_price = total_cost * (1 + profit_margin)  # Apply profit margin

            dish_expiry_mapping.append({
                "Dish_Name": recipe.Dish_Name,
                "Earliest_Expiry": earliest_expiry_date.strftime("%Y-%m-%d") if earliest_expiry_date else None,
                "Total_Cost": round(total_cost, 2),
                "Final_Price": round(final_price, 2),
                "Profit_Margin": f"{int(profit_margin * 100)}%"
            })

    # ✅ Sort dishes by **earliest expiring ingredient**
    dish_expiry_mapping.sort(key=lambda x: x["Earliest_Expiry"] if x["Earliest_Expiry"] else datetime.max)

    return {"menu": dish_expiry_mapping}


@app.get("/forecast/{n_days}")
def forecast_sales(n_days: int, db: Session = Depends(get_db)):
    if n_days <= 0:
        raise HTTPException(status_code=400, detail="⚠ Number of days must be positive.")
    
    data_records = db.query(DailyActivity).all()
    if not data_records:
        raise HTTPException(status_code=400, detail="⚠ No data available for forecasting.")
    
    # Convert stored records to DataFrame
    df = pd.DataFrame([{
        'Date_Time': record.Date_Time,
        'Item_Name': record.Item_Name,
        'Quantity_Sold': record.Quantity_Sold,
        'Revenue': record.Revenue,
        'Customer_Count': record.Customer_Count,
        'Weather_Condition': record.Weather_Condition,
        'Day_Type': record.Day_Type
    } for record in data_records])
    
    df['Date_Time'] = pd.to_datetime(df['Date_Time'])
    df['date'] = df['Date_Time'].dt.date
    df['day_of_week'] = df['Date_Time'].dt.weekday
    df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
    
    items = df['Item_Name'].unique()
    all_predictions = []
    
    today = datetime.now().date()
    
    for item in items:
        item_data = df[df['Item_Name'] == item].copy()
        
        if len(item_data) < 50:
            continue
        
        daily_data = item_data.groupby('date').agg({
            'Quantity_Sold': 'sum',
            'Revenue': 'mean',
            'is_weekend': 'max',
        }).reset_index()
        
        daily_data.rename(columns={'date': 'ds', 'Quantity_Sold': 'y'}, inplace=True)
        daily_data['weekend'] = daily_data['is_weekend']
        
        model = Prophet(daily_seasonality=True, weekly_seasonality=True)
        model.add_regressor('weekend')
        model.fit(daily_data)
        
        future_dates = pd.date_range(start=today, periods=n_days)
        future = pd.DataFrame({'ds': future_dates})
        future['weekend'] = future['ds'].dt.dayofweek.apply(lambda x: 1 if x >= 5 else 0)
        
        forecast = model.predict(future)
        
        item_forecast = forecast[['ds', 'yhat']].copy()
        item_forecast['Item_Name'] = item
        item_forecast['yhat'] = item_forecast['yhat'].round().astype(int)
        all_predictions.append(item_forecast)
    
    if not all_predictions:
        raise HTTPException(status_code=400, detail="⚠ Not enough data for forecasting.")
    
    predictions_df = pd.concat(all_predictions, ignore_index=True)
    predictions_df.rename(columns={'ds': 'Date', 'yhat': 'Predicted_Quantity'}, inplace=True)
    
    return predictions_df.to_dict(orient='records')

@app.get("/inventory/ai-analysis")
def ai_inventory_analysis(db: Session = Depends(get_db)):
    inventory_items = db.query(InventoryItem).all()
    if not inventory_items:
        raise HTTPException(status_code=400, detail="⚠ No inventory data available.")
    
    inventory_df = pd.DataFrame([{ 
        'Item_Name': item.Item_Name,
        'Quantity': item.Quantity,
        'Expiry_Date': item.Expiry_Date
    } for item in inventory_items])
    
    current_date = datetime.today()
    expiry_threshold = 7  # Days
    inventory_df["Expiry_Risk"] = np.where(
        (inventory_df["Expiry_Date"] - current_date).dt.days < expiry_threshold,
        "High Risk - Sell/Dispose", "Safe")
    
    inventory_df["Reorder_Required"] = np.where(inventory_df["Quantity"] < 10, "Yes", "No")
    
    return inventory_df.to_dict(orient='records')

class ImageRequest(BaseModel):
    image_url: str

# ===========================
# IMAGE PROCESSING ENDPOINT
# ===========================

@app.post("/analyze-food")
async def analyze_food(file: UploadFile = File(...)):
    try:
        # Read and open the uploaded image
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))

        # Identify food items
        model = genai.GenerativeModel("gemini-1.5-flash")
        response_food = model.generate_content([
            "Identify all food items in the image and return them in a structured format: "
            "each item followed by its quantity, separated by commas. "
            "Do not include any extra text, descriptions, or explanations. Example format: '2 apples, 150g rice, 1 sandwich'.",
            img
        ])

        if not response_food.text:
            raise HTTPException(status_code=500, detail="Failed to identify food items")
        
        # Extract only valid food items and quantities
        extracted_items = re.findall(r"(\d+\s*[a-zA-Z]*\s+[a-zA-Z]+)", response_food.text)
        food_map = {}

        for item in extracted_items:
            match = re.match(r"(\d+\s*[a-zA-Z]*)\s+(.+)", item.strip())
            if match:
                quantity = match.group(1)
                name = match.group(2)
            else:
                quantity = "1"
                name = item.strip()
            
            food_map[name] = quantity

        return {"food_items": food_map}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
