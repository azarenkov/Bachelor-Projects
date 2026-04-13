#!/bin/bash

# Booking Platform - Demo Data Setup Script
# This script creates demo users, hotels, rooms, and bookings

set -e

BASE_URL="http://localhost:8080"

echo "=========================================="
echo "  Booking Platform - Demo Data Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to extract token from JSON response
extract_token() {
    echo "$1" | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

# Function to extract ID from JSON response
extract_id() {
    echo "$1" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

echo "🔄 Creating demo users..."
echo ""

# 1. Create Guest User
echo "1️⃣  Creating guest user..."
GUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "password123"
  }')

GUEST_TOKEN=$(extract_token "$GUEST_RESPONSE")
if [ -n "$GUEST_TOKEN" ]; then
    echo -e "   ${GREEN}✓${NC} Guest user created: alice@example.com"
else
    echo -e "   ${RED}✗${NC} Failed to create guest user"
    echo "Response: $GUEST_RESPONSE"
fi
echo ""

# 2. Create Hotel Owner 1
echo "2️⃣  Creating hotel owner 1..."
OWNER1_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Robert Smith",
    "email": "robert@hotelowner.com",
    "password": "password123"
  }')

OWNER1_TOKEN=$(extract_token "$OWNER1_RESPONSE")
if [ -n "$OWNER1_TOKEN" ]; then
    echo -e "   ${GREEN}✓${NC} Owner 1 created: robert@hotelowner.com"
else
    echo -e "   ${RED}✗${NC} Failed to create owner 1"
fi
echo ""

# 3. Create Hotel Owner 2
echo "3️⃣  Creating hotel owner 2..."
OWNER2_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Garcia",
    "email": "maria@hotelowner.com",
    "password": "password123"
  }')

OWNER2_TOKEN=$(extract_token "$OWNER2_RESPONSE")
if [ -n "$OWNER2_TOKEN" ]; then
    echo -e "   ${GREEN}✓${NC} Owner 2 created: maria@hotelowner.com"
else
    echo -e "   ${RED}✗${NC} Failed to create owner 2"
fi
echo ""

echo "🏨 Creating hotels..."
echo ""

# 4. Create Hotel 1 - Grand Plaza Hotel (Owner 1)
echo "1️⃣  Grand Plaza Hotel (New York)..."
HOTEL1_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "name": "Grand Plaza Hotel",
    "description": "Luxury hotel in the heart of Manhattan with stunning city views and world-class amenities.",
    "city": "New York",
    "address": "123 Fifth Avenue, Manhattan"
  }')

HOTEL1_ID=$(extract_id "$HOTEL1_RESPONSE")
if [ -n "$HOTEL1_ID" ]; then
    echo -e "   ${GREEN}✓${NC} Grand Plaza Hotel created (ID: $HOTEL1_ID)"
else
    echo -e "   ${RED}✗${NC} Failed to create Grand Plaza Hotel"
    echo "Response: $HOTEL1_RESPONSE"
fi
echo ""

# 5. Create Hotel 2 - Seaside Resort (Owner 1)
echo "2️⃣  Seaside Resort (Miami)..."
HOTEL2_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -d '{
    "name": "Seaside Resort",
    "description": "Beautiful beachfront resort with ocean views, private beach access, and tropical paradise atmosphere.",
    "city": "Miami",
    "address": "456 Ocean Drive, Miami Beach"
  }')

HOTEL2_ID=$(extract_id "$HOTEL2_RESPONSE")
if [ -n "$HOTEL2_ID" ]; then
    echo -e "   ${GREEN}✓${NC} Seaside Resort created (ID: $HOTEL2_ID)"
else
    echo -e "   ${RED}✗${NC} Failed to create Seaside Resort"
fi
echo ""

# 6. Create Hotel 3 - City Center Inn (Owner 2)
echo "3️⃣  City Center Inn (London)..."
HOTEL3_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "name": "City Center Inn",
    "description": "Modern boutique hotel in central London, walking distance to major attractions and shopping.",
    "city": "London",
    "address": "789 Oxford Street, Westminster"
  }')

HOTEL3_ID=$(extract_id "$HOTEL3_RESPONSE")
if [ -n "$HOTEL3_ID" ]; then
    echo -e "   ${GREEN}✓${NC} City Center Inn created (ID: $HOTEL3_ID)"
else
    echo -e "   ${RED}✗${NC} Failed to create City Center Inn"
fi
echo ""

# 7. Create Hotel 4 - Mountain View Lodge (Owner 2)
echo "4️⃣  Mountain View Lodge (Denver)..."
HOTEL4_RESPONSE=$(curl -s -X POST "$BASE_URL/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -d '{
    "name": "Mountain View Lodge",
    "description": "Cozy mountain retreat with breathtaking Rocky Mountain views and outdoor adventures.",
    "city": "Denver",
    "address": "321 Mountain Road, Colorado"
  }')

HOTEL4_ID=$(extract_id "$HOTEL4_RESPONSE")
if [ -n "$HOTEL4_ID" ]; then
    echo -e "   ${GREEN}✓${NC} Mountain View Lodge created (ID: $HOTEL4_ID)"
else
    echo -e "   ${RED}✗${NC} Failed to create Mountain View Lodge"
fi
echo ""

# Add Rooms to Hotels
if [ -n "$HOTEL1_ID" ]; then
    echo "🚪 Adding rooms to Grand Plaza Hotel..."

    curl -s -X POST "$BASE_URL/hotels/$HOTEL1_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER1_TOKEN" \
      -d '{
        "room_number": "101",
        "type": "Deluxe Suite",
        "description": "Spacious suite with king bed and city view",
        "price_per_day": 250,
        "capacity": 2
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room 101 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL1_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER1_TOKEN" \
      -d '{
        "room_number": "201",
        "type": "Executive Room",
        "description": "Elegant room with queen bed and work area",
        "price_per_day": 180,
        "capacity": 2
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room 201 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL1_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER1_TOKEN" \
      -d '{
        "room_number": "301",
        "type": "Standard Room",
        "description": "Comfortable room with double bed",
        "price_per_day": 120,
        "capacity": 2
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room 301 added"
    echo ""
fi

if [ -n "$HOTEL2_ID" ]; then
    echo "🚪 Adding rooms to Seaside Resort..."

    curl -s -X POST "$BASE_URL/hotels/$HOTEL2_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER1_TOKEN" \
      -d '{
        "room_number": "A1",
        "type": "Ocean View Suite",
        "description": "Luxurious suite with panoramic ocean views",
        "price_per_day": 350,
        "capacity": 3
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room A1 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL2_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER1_TOKEN" \
      -d '{
        "room_number": "B5",
        "type": "Beach Bungalow",
        "description": "Private bungalow steps from the beach",
        "price_per_day": 280,
        "capacity": 2
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room B5 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL2_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER1_TOKEN" \
      -d '{
        "room_number": "C10",
        "type": "Garden Room",
        "description": "Peaceful room overlooking tropical gardens",
        "price_per_day": 200,
        "capacity": 2
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room C10 added"
    echo ""
fi

if [ -n "$HOTEL3_ID" ]; then
    echo "🚪 Adding rooms to City Center Inn..."

    curl -s -X POST "$BASE_URL/hotels/$HOTEL3_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER2_TOKEN" \
      -d '{
        "room_number": "12",
        "type": "Premium Double",
        "description": "Modern room with two double beds",
        "price_per_day": 160,
        "capacity": 4
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room 12 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL3_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER2_TOKEN" \
      -d '{
        "room_number": "15",
        "type": "Boutique Single",
        "description": "Cozy single room with modern amenities",
        "price_per_day": 110,
        "capacity": 1
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room 15 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL3_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER2_TOKEN" \
      -d '{
        "room_number": "25",
        "type": "Family Suite",
        "description": "Spacious suite perfect for families",
        "price_per_day": 220,
        "capacity": 5
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room 25 added"
    echo ""
fi

if [ -n "$HOTEL4_ID" ]; then
    echo "🚪 Adding rooms to Mountain View Lodge..."

    curl -s -X POST "$BASE_URL/hotels/$HOTEL4_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER2_TOKEN" \
      -d '{
        "room_number": "Pine1",
        "type": "Mountain Cabin",
        "description": "Rustic cabin with mountain views and fireplace",
        "price_per_day": 190,
        "capacity": 3
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room Pine1 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL4_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER2_TOKEN" \
      -d '{
        "room_number": "Oak5",
        "type": "Alpine Suite",
        "description": "Luxury suite with balcony and hot tub",
        "price_per_day": 280,
        "capacity": 4
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room Oak5 added"

    curl -s -X POST "$BASE_URL/hotels/$HOTEL4_ID/rooms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OWNER2_TOKEN" \
      -d '{
        "room_number": "Cedar3",
        "type": "Standard Lodge Room",
        "description": "Comfortable room with mountain decor",
        "price_per_day": 140,
        "capacity": 2
      }' > /dev/null
    echo -e "   ${GREEN}✓${NC} Room Cedar3 added"
    echo ""
fi

# Create sample booking for guest user
if [ -n "$HOTEL1_ID" ] && [ -n "$GUEST_TOKEN" ]; then
    echo "📅 Creating sample booking..."

    # Get tomorrow's date and 3 days from now
    CHECK_IN=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d 2>/dev/null || echo "2024-12-20")
    CHECK_OUT=$(date -d "+3 days" +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d 2>/dev/null || echo "2024-12-23")

    # Get first room ID
    ROOM_RESPONSE=$(curl -s "$BASE_URL/hotels/$HOTEL1_ID/rooms")
    ROOM_ID=$(echo "$ROOM_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    if [ -n "$ROOM_ID" ]; then
        curl -s -X POST "$BASE_URL/bookings" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $GUEST_TOKEN" \
          -d "{
            \"hotel_id\": $HOTEL1_ID,
            \"room_id\": $ROOM_ID,
            \"check_in\": \"$CHECK_IN\",
            \"check_out\": \"$CHECK_OUT\"
          }" > /dev/null
        echo -e "   ${GREEN}✓${NC} Sample booking created for Grand Plaza Hotel"
    fi
    echo ""
fi

echo "=========================================="
echo -e "  ${GREEN}✅ Demo Data Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "   • 3 Users created (1 guest + 2 owners)"
echo "   • 4 Hotels created"
echo "   • 15 Rooms added across all hotels"
echo "   • 1 Sample booking created"
echo ""
echo "🔐 Login Credentials:"
echo ""
echo -e "   ${BLUE}Guest Account:${NC}"
echo "   Email: alice@example.com"
echo "   Password: password123"
echo ""
echo -e "   ${BLUE}Owner Account 1:${NC}"
echo "   Email: robert@hotelowner.com"
echo "   Password: password123"
echo "   Hotels: Grand Plaza, Seaside Resort"
echo ""
echo -e "   ${BLUE}Owner Account 2:${NC}"
echo "   Email: maria@hotelowner.com"
echo "   Password: password123"
echo "   Hotels: City Center Inn, Mountain View Lodge"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo ""
