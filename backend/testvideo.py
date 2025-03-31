import cv2
import requests
import numpy as np
import os
import re

# Flask API URL
API_URL = "http://127.0.0.1:8000/analyze-food"

# Load the static video file
VIDEO_PATH = "test.mp4"  # Replace with your video file path
cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print(f"❌ Error: Could not open video file {VIDEO_PATH}")
    exit()

food_stock = {}

def process_frame(frame):
    # Convert frame to a format suitable for Gemini API (JPEG)
    _, img_encoded = cv2.imencode('.jpg', frame)
    files = {"image": ("frame.jpg", img_encoded.tobytes(), "image/jpeg")}
    
    # Send frame to Flask server for food detection
    response = requests.post(API_URL, files=files)
    
    if response.status_code != 200:
        print("❌ Error: Failed to analyze frame")
        return []

    try:
        data = response.json()
        food_items = data.get("food_items", [])
    except:
        print("❌ Error: Invalid JSON response")
        return []
    
    return food_items

def update_stock(food_items):
    for item in food_items:
        match = re.match(r"(\d+[\-\d]*)\s(.+)", item.strip())
        if match:
            quantity = match.group(1)
            name = match.group(2)
        else:
            quantity = "1"  # Default quantity
            name = item.strip()

        # Update food stock tracking
        if name in food_stock:
            food_stock[name] = max(food_stock[name], int(quantity))
        else:
            food_stock[name] = int(quantity)

# Process the video frame-by-frame
frame_count = 0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break  # End of video

    frame_count += 1
    if frame_count % 30 == 0:  # Analyze every 30th frame for efficiency
        print(f"Processing frame {frame_count}...")
        food_items = process_frame(frame)
        update_stock(food_items)

    # Display the video feed with overlay
    display_text = "Detected Items: " + ", ".join(food_stock.keys())
    cv2.putText(frame, display_text, (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    cv2.imshow("Stock Tracking", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):  # Press 'q' to quit
        break

cap.release()
cv2.destroyAllWindows()

# Print final food stock
print("\nFinal Stock Levels:")
for item, qty in food_stock.items():
    print(f"{item}: {qty}")