from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from database import Base

# ✅ Inventory Model
class InventoryItem(Base):
    __tablename__ = "inventory"

    Item_ID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Item_Name = Column(String)
    Category = Column(String)
    Quantity = Column(Float)
    Unit = Column(String)
    Price_per_Unit = Column(Float)
    Expiry_Date = Column(DateTime)
    Storage_Location = Column(String)
    Detected_By_AI = Column(Boolean)
    Confidence_Score = Column(Float)

# ✅ Daily Activity Model
class DailyActivity(Base):
    __tablename__ = "daily_activity"

    Order_ID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Date_Time = Column(DateTime, nullable=False)
    Item_Name = Column(String, nullable=False)
    Quantity_Sold = Column(Integer, nullable=False)
    Revenue = Column(Float, nullable=False)
    Customer_Count = Column(Integer, nullable=False)
    Weather_Condition = Column(String, nullable=True)
    Day_Type = Column(String, nullable=False)

# ✅ Customer Order Model
class CustomerOrder(Base):
    __tablename__ = "customer_order"

    Order_ID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Customer_ID = Column(Integer, nullable=False)
    Date_Time = Column(DateTime, nullable=False)
    Items_Ordered = Column(JSON, nullable=False)
    Total_Bill = Column(Float, nullable=False)
    Order_Status = Column(String, nullable=False)

# ✅ Recipe Model
class Recipe(Base):
    __tablename__ = "recipe"

    Recipe_ID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Dish_Name = Column(String, nullable=False)
    Ingredients = Column(JSON, nullable=False)
    Calories = Column(Float, nullable=False)
    Prep_Time = Column(Integer, nullable=False)
    Cooking_Time = Column(Integer, nullable=False)
    price = Column(Float) 
