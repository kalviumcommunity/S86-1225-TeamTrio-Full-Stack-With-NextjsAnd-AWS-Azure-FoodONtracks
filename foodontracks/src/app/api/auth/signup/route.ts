import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { User, UserRole, ROLE_LEVELS } from '@/models/User';
import { Restaurant } from '@/models/Restaurant';
import { RestaurantAddress } from '@/models/RestaurantAddress';
import { DeliveryAgent } from '@/models/DeliveryAgent';
import { validateEmailForRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import withLogging from '@/lib/requestLogger';

export const POST = withLogging(async (req: Request) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, password, role, phoneNumber, restaurantStreet, restaurantCity, restaurantState, restaurantZipCode } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name, email, password, role' },
        { status: 400 }
      );
    }

    // Validate phone number for delivery agents
    if (role === UserRole.DELIVERY_GUY && (!phoneNumber || phoneNumber.trim().length < 10)) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required for delivery agents (minimum 10 digits)' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid role',
          allowedRoles: Object.values(UserRole)
        },
        { status: 400 }
      );
    }

    // Validate email domain for role
    const emailValidation = validateEmailForRole(email, role as UserRole);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: emailValidation.message,
          role,
          emailDomainRules: {
            ADMIN: 'Must end with @admin.com',
            RESTAURANT_OWNER: 'Must end with @restaurant.com',
            CUSTOMER: 'Any valid email domain allowed'
          }
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // STEP 1: Create user FIRST (without restaurantId)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role as UserRole,
      roleLevel: ROLE_LEVELS[role as UserRole],
      phoneNumber,
      isActive: true,
    });

    // STEP 2: If RESTAURANT_OWNER, create restaurant with proper ownerId
    if (role === UserRole.RESTAURANT_OWNER) {
      try {
        // Build full address from components
        const addressParts = [
          restaurantStreet,
          restaurantCity,
          restaurantState,
          restaurantZipCode
        ].filter(Boolean);
        const fullAddress = addressParts.length > 0 
          ? addressParts.join(', ') 
          : 'Please update your restaurant address';

        const newRestaurant = await Restaurant.create({
          name: `${name}'s Restaurant`,
          description: 'Welcome! Update your restaurant details in the dashboard.',
          address: fullAddress,
          phoneNumber: phoneNumber || '0000000000',
          email: email.toLowerCase(),
          ownerId: user._id, // ✅ CRITICAL: Set ownerId immediately
          cuisine: ['Indian'],
          isActive: true,
        });

        // Create RestaurantAddress if address details provided
        if (restaurantStreet && restaurantCity && restaurantState && restaurantZipCode) {
          await RestaurantAddress.create({
            restaurantId: newRestaurant._id,
            street: restaurantStreet,
            city: restaurantCity,
            state: restaurantState,
            zipCode: restaurantZipCode,
            country: 'India',
          });
        }

        // STEP 3: Update user with restaurantId
        user.restaurantId = newRestaurant._id as any;
        await user.save();

        logger.info('restaurant_auto_created', {
          userId: user._id.toString(),
          context: {
            restaurantId: newRestaurant._id.toString(),
            ownerName: name,
          },
        });
      } catch (restaurantError: any) {
        // If restaurant creation fails, delete the user to maintain consistency
        await User.findByIdAndDelete(user._id);
        logger.error('restaurant_creation_failed', restaurantError);
        
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to create restaurant. Please try again.',
            error: restaurantError.message 
          },
          { status: 500 }
        );
      }
    }

    // STEP 2B: If DELIVERY_GUY, create delivery agent profile
    if (role === UserRole.DELIVERY_GUY) {
      try {
        await DeliveryAgent.create({
          userId: user._id,
          vehicleType: 'BIKE', // Default, can be updated later
          isAvailable: true,
          isVerified: false, // Needs admin verification
          isActive: true,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          cancelledDeliveries: 0,
          averageRating: 0,
          joinedAt: new Date(),
        });

        logger.info('delivery_agent_auto_created', {
          userId: user._id.toString(),
          context: { name },
        });
      } catch (deliveryAgentError: any) {
        // If delivery agent creation fails, delete the user to maintain consistency
        await User.findByIdAndDelete(user._id);
        logger.error('delivery_agent_creation_failed', deliveryAgentError);
        
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to create delivery agent profile. Please try again.',
            error: deliveryAgentError.message 
          },
          { status: 500 }
        );
      }
    }

    // Return safe user data (no password)
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      restaurantId: user.restaurantId,
      isActive: user.isActive,
    };

    logger.info('user_signup_success', {
      userId: user._id?.toString(),
      context: {
        email: user.email,
        role: user.role,
      },
    });

    // Determine redirect URL based on role
    const redirectMap: Record<string, string> = {
      ADMIN: '/dashboard/admin',
      RESTAURANT_OWNER: '/dashboard/restaurant',
      DELIVERY_GUY: '/dashboard/delivery',
      CUSTOMER: '/dashboard/customer',
    };
    const redirectUrl = redirectMap[user.role] || '/dashboard';

    return NextResponse.json({
      success: true,
      message: 'Signup successful',
      user: safeUser,
      redirectUrl, // Role-based redirect URL
    });
  } catch (err: any) {
    logger.error('auth_signup_error', err, { 
      context: { 
        errorMessage: err?.message,
        errorName: err?.name,
        errorStack: err?.stack 
      } 
    });
    return NextResponse.json(
      { success: false, message: 'Signup failed', error: err.message },
      { status: 500 }
    );
  }
});