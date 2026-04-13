#!/bin/bash

BASE_URL="http://localhost:8080"

echo "=========================================="
echo "  Booking Platform - Demo Data Setup"
echo "=========================================="
echo ""

echo "🔄 Creating demo users..."
echo ""

echo "1️⃣  Creating guest user..."
GUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "password123"
  }')

GUEST_TOKEN=$(echo "$GUEST_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "   ✓ Guest user created: alice@example.com"

echo ""
echo "2️⃣  Creating hotel owner 1..."
OWNER1_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Robert Smith",
    "email": "robert@hotelowner.com",
    "password": "password123"
  }')

OWNER1_TOKEN=$(echo "$OWNER1_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "   ✓ Owner 1 created: robert@hotelowner.com"

echo ""
echo "3️⃣  Creating hotel owner 2..."
OWNER2_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Garcia",
    "email": "maria@hotelowner.com",
    "password": "password123"
  }')

OWNER2_TOKEN=$(echo "$OWNER2_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "   ✓ Owner 2 created: maria@hotelowner.com"

echo ""
echo "🏨 Creating hotels..."
echo ""

echo "1️⃣  Grand Plaza Hotel (New York)..."
HOTEL1_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "name": "Grand Plaza Hotel",
    "description": "Luxury 5-star hotel in the heart of Manhattan. Experience world-class service, elegant rooms, and breathtaking city views.",
    "city": "New York",
    "address": "768 Fifth Avenue, Manhattan"
  }')

HOTEL1_ID=$(echo "$HOTEL1_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   ✓ Grand Plaza Hotel created (ID: $HOTEL1_ID)"

echo ""
echo "2️⃣  Seaside Resort (Miami)..."
HOTEL2_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "name": "Seaside Resort & Spa",
    "description": "Beachfront paradise with private beach access, infinity pool, and award-winning spa facilities. Perfect for a relaxing getaway.",
    "city": "Miami",
    "address": "1200 Ocean Drive, South Beach"
  }')

HOTEL2_ID=$(echo "$HOTEL2_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   ✓ Seaside Resort created (ID: $HOTEL2_ID)"

echo ""
echo "3️⃣  City Center Inn (London)..."
HOTEL3_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "name": "City Center Inn",
    "description": "Modern boutique hotel near major attractions. Walking distance to theaters, museums, and shopping districts.",
    "city": "London",
    "address": "45 Piccadilly Street, Westminster"
  }')

HOTEL3_ID=$(echo "$HOTEL3_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   ✓ City Center Inn created (ID: $HOTEL3_ID)"

echo ""
echo "4️⃣  Mountain View Lodge (Denver)..."
HOTEL4_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "name": "Mountain View Lodge",
    "description": "Rustic charm meets modern comfort. Stunning mountain views, outdoor activities, and cozy fireplaces.",
    "city": "Denver",
    "address": "3500 Rocky Mountain Road"
  }')

HOTEL4_ID=$(echo "$HOTEL4_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   ✓ Mountain View Lodge created (ID: $HOTEL4_ID)"

echo ""
echo "🚪 Adding rooms to Grand Plaza Hotel..."

curl -s -X POST "$BASE_URL/hotels/$HOTEL1_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "room_number": "101",
    "type": "Standard Room",
    "description": "Comfortable room with queen bed, work desk, and city view",
    "price_per_day": 150,
    "capacity": 2
  }' > /dev/null
echo "   ✓ Room 101 added"

curl -s -X POST "$BASE_URL/hotels/$HOTEL1_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "room_number": "201",
    "type": "Deluxe Suite",
    "description": "Spacious suite with king bed, living area, and panoramic views",
    "price_per_day": 250,
    "capacity": 3
  }' > /dev/null
echo "   ✓ Room 201 added"

curl -s -X POST "$BASE_URL/hotels/$HOTEL1_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "room_number": "301",
    "type": "Presidential Suite",
    "description": "Luxury suite with two bedrooms, dining room, and private terrace",
    "price_per_day": 500,
    "capacity": 4
  }' > /dev/null
echo "   ✓ Room 301 added"

echo ""
echo "🚪 Adding rooms to Seaside Resort..."

curl -s -X POST "$BASE_URL/hotels/$HOTEL2_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "room_number": "A1",
    "type": "Ocean View Room",
    "description": "Direct ocean view with balcony, perfect for watching sunsets",
    "price_per_day": 180,
    "capacity": 2
  }' > /dev/null
echo "   ✓ Room A1 added"

curl -s -X POST "$BASE_URL/hotels/$HOTEL2_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "room_number": "B5",
    "type": "Beach Bungalow",
    "description": "Private bungalow with direct beach access and outdoor shower",
    "price_per_day": 300,
    "capacity": 2
  }' > /dev/null
echo "   ✓ Room B5 added"

curl -s -X POST "$BASE_URL/hotels/$HOTEL2_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "room_number": "C10",
    "type": "Family Villa",
    "description": "Two-bedroom villa with kitchenette and private pool",
    "price_per_day": 450,
    "capacity": 6
  }' > /dev/null
echo "   ✓ Room C10 added"

echo ""
echo "🚪 Adding rooms to City Center Inn..."

curl -s -X POST "$BASE_URL/hotels/$HOTEL3_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "room_number": "12",
    "type": "Classic Single",
    "description": "Cozy single room perfect for solo travelers",
    "price_per_day": 90,
    "capacity": 1
  }' > /dev/null
echo "   ✓ Room 12 added"

curl -s -X POST "$BASE_URL/hotels/$HOTEL3_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "room_number": "15",
    "type": "Double Room",
    "description": "Modern room with two single beds and workspace",
    "price_per_day": 120,
    "capacity": 2
  }' > /dev/null
echo "   ✓ Room 15 added"

curl -s -X POST "$BASE_URL/hotels/$HOTEL3_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "room_number": "25",
    "type": "Executive Suite",
    "description": "Premium suite with meeting area and skyline views",
    "price_per_day": 200,
    "capacity": 2
  }' > /dev/null
echo "   ✓ Room 25 added"

echo ""
echo "🚪 Adding rooms to Mountain View Lodge..."

curl -s -X POST "$BASE_URL/hotels/$HOTEL4_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "room_number": "Pine1",
    "type": "Mountain Cabin",
    "description": "Rustic cabin with fireplace and mountain views",
    "price_per_day": 140,
    "capacity": 2
  }' > /dev/null
echo "   ✓ Room Pine1 added"

curl -s -X POST "$BASE_URL/hotels/$HOTEL4_ID/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "room_number": "Oak5",
    "type": "Deluxe Cabin",
    "description": "Spacious cabin with jacuzzi and private deck",
    "price_per_day": 220,
    "capacity": 4
  }' > /dev/null
echo "   ✓ Room Oak5 added"

echo ""
echo "📅 Creating sample bookings..."

curl -s -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d "{
    \"hotel_id\": $HOTEL1_ID,
    \"room_id\": 1,
    \"check_in\": \"2024-06-15\",
    \"check_out\": \"2024-06-20\"
  }" > /dev/null
echo "   ✓ Sample booking created for Grand Plaza Hotel"

echo ""
echo "=========================================="
echo "  ✅ Demo Data Setup Complete!"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "   • 3 Users created (1 guest + 2 owners)"
echo "   • 4 Hotels created"
echo "   • 14 Rooms added across all hotels"
echo "   • 1 Sample booking created"
echo ""
echo "🔐 Login Credentials:"
echo ""
echo "   Guest Account:"
echo "   Email: alice@example.com"
echo "   Password: password123"
echo ""
echo "   Owner Account 1:"
echo "   Email: robert@hotelowner.com"
echo "   Password: password123"
echo "   Hotels: Grand Plaza, Seaside Resort"
echo ""
echo "   Owner Account 2:"
echo "   Email: maria@hotelowner.com"
echo "   Password: password123"
echo "   Hotels: City Center Inn, Mountain View Lodge"
echo ""
echo "🌐 Access the app at: http://localhost:8080"
echo ""
