/**
 * API Route RBAC Helper
 * Simplifies applying RBAC to API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserRole, ROLE_LEVELS } from '@/types/user';
import { hasPermission, Resource, Action, applyRoleFilter } from '@/lib/rbac';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  roleLevel: number;
  restaurantId?: string;
}

/**
 * Extract user from JWT token
 */
export function extractAuthUser(request: NextRequest): AuthUser | null {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as UserRole,
      roleLevel: decoded.roleLevel || ROLE_LEVELS[decoded.role as UserRole],
      restaurantId: decoded.restaurantId,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Wrapper to require authentication
 */
export function withAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = extractAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(req, user);
  };
}

/**
 * Wrapper to require specific permission
 */
export function withPermission(
  resource: Resource,
  action: Action,
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = extractAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!hasPermission(user.role, resource, action)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Insufficient permissions',
          required: { resource, action },
          userRole: user.role,
        },
        { status: 403 }
      );
    }
    
    return handler(req, user);
  };
}

/**
 * Wrapper to require specific role(s)
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = extractAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Access denied',
          allowedRoles,
          userRole: user.role,
        },
        { status: 403 }
      );
    }
    
    return handler(req, user);
  };
}

/**
 * Helper to apply ownership filters to queries
 */
export function applyOwnershipFilter(
  baseFilter: any,
  user: AuthUser,
  resource: Resource
): any {
  return applyRoleFilter(
    baseFilter,
    user.role,
    user.userId,
    user.restaurantId
  );
}
