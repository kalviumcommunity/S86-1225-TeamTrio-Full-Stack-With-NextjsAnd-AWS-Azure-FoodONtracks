import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { RestaurantAddress } from "@/models/RestaurantAddress";

export const runtime = "nodejs";

// GET /api/restaurant-address/cities - Get all unique cities
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const cities = await RestaurantAddress.distinct('city');
    
    return NextResponse.json({
      success: true,
      data: cities.sort(),
      total: cities.length,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

// POST /api/restaurant-address/cities - Add address for existing restaurant
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const { restaurantId, street, city, state, zipCode, country, landmark } = body;

    if (!restaurantId || !street || !city || !state || !zipCode) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if address already exists
    const existingAddress = await RestaurantAddress.findOne({ restaurantId });

    if (existingAddress) {
      // Update existing address
      const updated = await RestaurantAddress.findOneAndUpdate(
        { restaurantId },
        { $set: { street, city, state, zipCode, country, landmark } },
        { new: true }
      );
      
      return NextResponse.json({
        success: true,
        data: updated,
        message: "Restaurant address updated successfully",
      });
    } else {
      // Create new address
      const newAddress = await RestaurantAddress.create({
        restaurantId,
        street,
        city,
        state,
        zipCode,
        country: country || 'India',
        landmark,
      });

      return NextResponse.json({
        success: true,
        data: newAddress,
        message: "Restaurant address created successfully",
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating restaurant address:', error);
    return NextResponse.json(
      { success: false, error: "Failed to create/update restaurant address" },
      { status: 500 }
    );
  }
}
