/**
 * Role-Based Access Control (RBAC) Utilities
 * FoodONtracks - Indian Railway Catering Platform
 */

import { UserRole, ROLE_LEVELS } from '@/types/user';

// Permission Matrix Type
export type Resource =
  | 'users'
  | 'restaurants'
  | 'menuItems'
  | 'orders'
  | 'reviews'
  | 'addresses'
  | 'transactions'
  | 'deliveryPersons'
  | 'batches';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Permission Matrix Implementation
export const PERMISSION_MATRIX: Record<Resource, Record<UserRole, Action[]>> = {
  users: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['read'],
    [UserRole.DELIVERY_GUY]: ['read'], // own only
    [UserRole.CUSTOMER]: ['read', 'update'], // own only
  },
  restaurants: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['read', 'update'], // own only
    [UserRole.DELIVERY_GUY]: ['read'],
    [UserRole.CUSTOMER]: ['read'],
  },
  menuItems: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['create', 'read', 'update', 'delete'], // own only
    [UserRole.DELIVERY_GUY]: ['read'],
    [UserRole.CUSTOMER]: ['read'],
  },
  orders: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['read', 'update'], // restaurant orders only
    [UserRole.DELIVERY_GUY]: ['read', 'update'], // assigned orders only
    [UserRole.CUSTOMER]: ['create', 'read', 'update'], // own only
  },
  reviews: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['read'],
    [UserRole.DELIVERY_GUY]: [],
    [UserRole.CUSTOMER]: ['create', 'read', 'update', 'delete'], // own only
  },
  addresses: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['read'],
    [UserRole.DELIVERY_GUY]: ['read'],
    [UserRole.CUSTOMER]: ['create', 'read', 'update', 'delete'], // own only
  },
  transactions: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['read'], // own restaurant transactions
    [UserRole.DELIVERY_GUY]: ['read'], // own delivery payments
    [UserRole.CUSTOMER]: ['read'], // own only
  },
  deliveryPersons: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['read'],
    [UserRole.DELIVERY_GUY]: ['read', 'update'], // own profile only
    [UserRole.CUSTOMER]: ['read'],
  },
  batches: {
    [UserRole.ADMIN]: ['create', 'read', 'update', 'delete', 'manage'],
    [UserRole.RESTAURANT_OWNER]: ['create', 'read', 'update'], // own batches only
    [UserRole.DELIVERY_GUY]: ['read', 'update'], // assigned batches only
    [UserRole.CUSTOMER]: ['read'], // public search
  },
};

/**
 * Check if user has permission for action on resource
 */
export function hasPermission(
  userRole: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const permissions = PERMISSION_MATRIX[resource]?.[userRole] || [];
  return permissions.includes(action) || permissions.includes('manage');
}

/**
 * Check if user role level is higher than or equal to required level
 */
export function hasMinimumRoleLevel(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

/**
 * Validate email domain matches role requirements
 * CRITICAL RULES:
 * - ADMIN: must use @admin.com
 * - RESTAURANT_OWNER: must use @restaurant.com
 * - DELIVERY_GUY: must use @delivery.com
 * - CUSTOMER: can use ANY domain EXCEPT @admin.com, @restaurant.com, @delivery.com
 */
export function validateEmailForRole(email: string, role: UserRole): {
  valid: boolean;
  message?: string;
} {
  const emailLower = email.toLowerCase();
  
  if (role === UserRole.ADMIN) {
    if (!emailLower.endsWith('@admin.com')) {
      return {
        valid: false,
        message: 'Admin accounts must use @admin.com email domain',
      };
    }
  } else if (role === UserRole.RESTAURANT_OWNER) {
    if (!emailLower.endsWith('@restaurant.com')) {
      return {
        valid: false,
        message: 'Restaurant owner accounts must use @restaurant.com email domain',
      };
    }
  } else if (role === UserRole.DELIVERY_GUY) {
    if (!emailLower.endsWith('@delivery.com')) {
      return {
        valid: false,
        message: 'Delivery personnel accounts must use @delivery.com email domain',
      };
    }
  } else if (role === UserRole.CUSTOMER) {
    // CUSTOMER cannot use reserved domains
    if (emailLower.endsWith('@admin.com')) {
      return {
        valid: false,
        message: 'Customers cannot use @admin.com domain. This is reserved for admins.',
      };
    }
    if (emailLower.endsWith('@restaurant.com')) {
      return {
        valid: false,
        message: 'Customers cannot use @restaurant.com domain. This is reserved for restaurant owners.',
      };
    }
    if (emailLower.endsWith('@delivery.com')) {
      return {
        valid: false,
        message: 'Customers cannot use @delivery.com domain. This is reserved for delivery personnel.',
      };
    }
    // Any other domain is valid for customers
  }
  
  return { valid: true };
}

/**
 * Generate unique batch number for orders
 * Format: foodontrack-<random-alphanumeric>
 */
export function generateBatchNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let batchId = '';
  
  for (let i = 0; i < 6; i++) {
    batchId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `foodontrack-${batchId}`;
}

/**
 * Check if user owns resource (for CUSTOMER and RESTAURANT_OWNER)
 */
export interface OwnershipCheck {
  userId?: string;
  restaurantId?: string;
  userRole: UserRole;
  resourceUserId?: string;
  resourceRestaurantId?: string;
}

export function checkOwnership(check: OwnershipCheck): boolean {
  // Admin can access everything
  if (check.userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Restaurant owner can access own restaurant resources
  if (check.userRole === UserRole.RESTAURANT_OWNER) {
    if (check.restaurantId && check.resourceRestaurantId) {
      return check.restaurantId === check.resourceRestaurantId;
    }
  }
  
  // Customer can access own resources
  if (check.userRole === UserRole.CUSTOMER) {
    if (check.userId && check.resourceUserId) {
      return check.userId === check.resourceUserId;
    }
  }
  
  return false;
}

/**
 * Filter query based on user role and ownership
 */
export function applyRoleFilter(
  baseQuery: any,
  userRole: UserRole,
  userId?: string,
  restaurantId?: string
): any {
  if (userRole === UserRole.ADMIN) {
    // Admin can see everything
    return baseQuery;
  }
  
  if (userRole === UserRole.RESTAURANT_OWNER && restaurantId) {
    // Restaurant owner sees only their restaurant's data
    return { ...baseQuery, restaurantId };
  }
  
  if (userRole === UserRole.CUSTOMER && userId) {
    // Customer sees only their own data
    return { ...baseQuery, userId };
  }
  
  return baseQuery;
}

/**
 * Get dashboard redirect path based on role
 */
export function getDashboardPath(role: UserRole): string {
  const paths = {
    [UserRole.ADMIN]: '/dashboard/admin',
    [UserRole.RESTAURANT_OWNER]: '/dashboard/restaurant',
    [UserRole.CUSTOMER]: '/dashboard/customer',
    [UserRole.DELIVERY_GUY]: '/dashboard/delivery',
  };
  
  return paths[role] || '/';
}
