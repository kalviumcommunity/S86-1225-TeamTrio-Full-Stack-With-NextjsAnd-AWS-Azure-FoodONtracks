# Delivery Person Order Assignment & Batch Verification Guide

## Overview
The delivery dashboard now includes a complete order assignment system with batch tracking verification. Delivery persons can:
1. View available orders ready for pickup
2. Assign orders to themselves
3. View batch tracking details updated by restaurants
4. Update order status through the delivery workflow

---

## Features Implemented

### 1. **Available Orders View**
- Shows all unassigned orders that are `ready` or `confirmed`
- Displays:
  - Batch number
  - Restaurant name and location
  - Delivery address and phone number
  - Order total amount
  - Order items list
- **Action**: "Assign to Me" button to take the order

### 2. **My Orders View**
- Shows all orders assigned to the current delivery person
- Includes batch tracking indicator when restaurant has updated details
- Status-based action buttons:
  - `ready` → "Mark Picked Up" (changes to `picked_by_delivery`)
  - `picked_by_delivery` → "Out for Delivery" (changes to `out_for_delivery`)
  - `out_for_delivery` → "Mark Delivered" (changes to `delivered`)

### 3. **Batch Tracking Verification Modal**
When a delivery person clicks on an assigned order, they can view:

#### Restaurant Verification Details:
- **Prepared By**: Staff member who prepared the food
- **Food Temperature (Ready)**: Temperature when food was ready (°C)
- **Handover Temperature**: Temperature when handed to delivery person (°C)
- **Quality Check**: Whether quality inspection was passed (✅/❌)
- **Special Notes**: Any additional instructions or information

#### Order Information:
- Delivery address and customer phone
- Complete list of items with quantities and prices
- Total order amount
- Current order status

---

## API Endpoints Created

### 1. `/api/delivery/available-orders` (GET)
- Fetches orders ready for delivery but not yet assigned
- Filters: `status` in ['ready', 'confirmed'] AND `deliveryPersonId` is null
- Returns: Array of order objects with restaurant and item details

### 2. `/api/delivery/assign` (POST)
- Assigns an order to the current delivery person
- Body: `{ orderId: string }`
- Updates:
  - Sets `deliveryPersonId` to current user
  - Changes status to `picked_by_delivery`
- Returns: Success message or error

### 3. `/api/delivery/my-orders` (GET)
- Fetches all orders assigned to the current delivery person
- Filters: `deliveryPersonId` matches current user
- Returns: Array of assigned orders with batch tracking details

---

## Workflow

### Order Assignment Flow:
```
Restaurant marks order "ready" 
    ↓
Order appears in "Available Orders" tab
    ↓
Delivery person clicks "Assign to Me"
    ↓
Order moves to "My Orders" tab with status "picked_by_delivery"
    ↓
Delivery person clicks on order to view batch tracking
    ↓
Verifies: Prepared by, temperatures, quality check
    ↓
Updates status: Picked Up → Out for Delivery → Delivered
```

### Batch Tracking Verification:
```
Restaurant prepares order
    ↓
Restaurant updates batch tracking:
    - Staff name
    - Food temperature (when ready)
    - Handover temperature (when given to delivery)
    - Quality check status
    - Special notes
    ↓
Delivery person assigns order
    ↓
Delivery person views tracking details in modal
    ↓
Verifies all information before pickup
    ↓
Updates status and delivers
```

---

## Database Fields

### Order Model Updates:
- `deliveryPersonId`: Reference to User (delivery person)
- `batchTracking`: Object containing:
  - `preparedBy`: String (staff name)
  - `preparedAt`: Date
  - `foodTemperature`: Number (°C)
  - `handoverTemperature`: Number (°C)
  - `handoverTime`: Date
  - `qualityCheck`: Boolean
  - `notes`: String

---

## UI Components

### View Toggle Buttons:
- **📦 Available Orders**: Shows unassigned orders
- **✅ My Orders**: Shows orders assigned to current user

### Order Cards:
- Color-coded borders (blue for available, green for assigned)
- Status badges with appropriate colors
- Batch tracking indicator (blue box) when details available
- Responsive grid layout (1 column mobile, 2 columns desktop)

### Verification Modal:
- Color-coded sections for different tracking details:
  - Green: Prepared by information
  - Blue: Food temperature (ready)
  - Orange: Handover temperature
  - Green/Gray: Quality check (passed/not done)
  - Purple: Special notes
- Action buttons change based on order status
- Click outside or "Close" button to dismiss

---

## Testing the Feature

1. **As Restaurant**:
   - Go to Dashboard → Batches
   - Click "Edit Tracking" on an order
   - Fill in batch tracking details (staff, temperatures, quality check)
   - Save

2. **As Delivery Person**:
   - Login to delivery dashboard
   - See the order in "Available Orders" tab
   - Click "Assign to Me"
   - Order moves to "My Orders" tab
   - Click on the order to view batch tracking modal
   - Verify all details (staff name, temperatures, quality check)
   - Click status update buttons to progress through workflow
   - Close modal

3. **Status Progression**:
   - Start: `ready` or `confirmed`
   - Assign: `picked_by_delivery`
   - Mark picked up: `picked_by_delivery`
   - Start delivery: `out_for_delivery`
   - Complete: `delivered`

---

## Notes

- All existing functionality preserved (old batch view still available for backwards compatibility, but hidden)
- Auto-refresh after order assignment or status update
- Toast notifications for success/error feedback
- Loading states during API calls
- Proper error handling with user-friendly messages
- Mobile-responsive design
- Accessibility-friendly with proper semantic HTML and ARIA labels
