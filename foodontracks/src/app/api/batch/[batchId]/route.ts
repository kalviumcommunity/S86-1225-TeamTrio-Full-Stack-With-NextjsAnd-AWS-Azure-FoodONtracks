import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Batch } from '@/models/Batch';
import { Order } from '@/models/Order';
import { extractAuthUser } from '@/lib/apiAuth';

// GET /api/batch/[batchId] - Get batch details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    await dbConnect();

    const { batchId } = await params;

    const batch = await Batch.findOne({ batchNumber: batchId })
      .populate('assignedDeliveryPerson', 'name phone')
      .lean();

    if (!batch) {
      return NextResponse.json(
        { success: false, message: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get all orders in this batch
    const orders = await Order.find({ batchId: batch._id })
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        batch,
        orders,
      },
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

// PUT /api/batch/[batchId] - Update batch status (DELIVERY_GUY only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = extractAuthUser(req);
    if (!user || user.role !== 'DELIVERY_GUY') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { batchId } = await params;
    const body = await req.json();
    const { status, location } = body;

    const batch = await Batch.findOne({ batchNumber: batchId });

    if (!batch) {
      return NextResponse.json(
        { success: false, message: 'Batch not found' },
        { status: 404 }
      );
    }

    // Verify the batch is assigned to this delivery person
    if (batch.assignedDeliveryPerson?.toString() !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'This batch is not assigned to you' },
        { status: 403 }
      );
    }

    // Update batch status
    if (status) {
      batch.status = status;
    }

    // Update location tracking
    if (location) {
      batch.currentLocation = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address,
      };
      batch.lastLocationUpdate = new Date();
    }

    await batch.save();

    // If batch is delivered, update all orders in the batch
    if (status === 'delivered') {
      await Order.updateMany(
        { batchId: batch._id },
        {
          $set: {
            status: 'delivered',
            'timeline.delivered': new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: batch,
      message: 'Batch updated successfully',
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update batch' },
      { status: 500 }
    );
  }
}
