import re
import requests
import os

# API Endpoint
url = "http://127.0.0.1:8000/analyze-food"

# Image file path
image_path = r"kitchen.jpeg"  # Ensure correct path

# Check if file exists
if not os.path.exists(image_path):
    print(f"❌ Error: The file '{image_path}' does not exist. Check the path and try again.")
    exit()

with open(image_path, "rb") as img_file:
    files = {"image": img_file}
    response = requests.post(url, files=files)

# Debugging: Print raw response before parsing JSON
print("\n===== Raw API Response =====")
print("Status Code:", response.status_code)
print("Response Text:", response.text)

# Attempt to parse JSON
try:
    data = response.json()
    food_items = data.get("food_items", [])
    
    # Remove unwanted introductory text
    food_items = [item for item in food_items if not item.lower().startswith("here's a list") and not "including quantities where possible" in item.lower()]
except requests.exceptions.JSONDecodeError:
    print("❌ Error: Response is not valid JSON. Check Flask server logs.")
    exit()

food_map = {}

# Extract quantity and item name
for item in food_items:
    match = re.match(r"(\d+[\-\d]*)\s(.+)", item.strip())
    if match:
        quantity = match.group(1)
        name = match.group(2)
    else:
        quantity = "1"  # Default quantity
        name = item.strip()
    
    food_map[name] = quantity

# Print structured data
print("\nFormatted Food List:")
print("Quantity | Item")
print("----------------------")
for name, qty in food_map.items():
    print(f"{qty:<8} | {name}")

# Print food map
print("\nFood Map:")
print(food_map)