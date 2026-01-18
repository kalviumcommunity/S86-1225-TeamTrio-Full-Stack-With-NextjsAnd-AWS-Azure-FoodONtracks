/**
 * User Role Types
 * Shared between client and server
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  DELIVERY_GUY = 'DELIVERY_GUY',
  CUSTOMER = 'CUSTOMER',
}

export const ROLE_LEVELS = {
  [UserRole.ADMIN]: 4,
  [UserRole.RESTAURANT_OWNER]: 3,
  [UserRole.DELIVERY_GUY]: 2,
  [UserRole.CUSTOMER]: 1,
};

// Email validation functions for each role
export const ROLE_EMAIL_RULES = {
  [UserRole.ADMIN]: (email: string) => email.endsWith('@admin.com'),
  [UserRole.RESTAURANT_OWNER]: (email: string) => email.endsWith('@restaurant.com'),
  [UserRole.DELIVERY_GUY]: (email: string) => email.endsWith('@delivery.com'),
  [UserRole.CUSTOMER]: (_email: string) => true, // Any email allowed
};
