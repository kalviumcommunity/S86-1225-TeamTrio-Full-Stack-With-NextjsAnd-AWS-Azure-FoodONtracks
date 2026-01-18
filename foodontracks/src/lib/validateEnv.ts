/**
 * Environment Variable Validation
 * Validates that all required environment variables are set before the app starts
 * This prevents cryptic runtime errors from missing configuration
 */

interface EnvVars {
  // Database
  MONGODB_URI: string;

  // Authentication
  JWT_SECRET: string;
  REFRESH_TOKEN_SECRET: string;

  // Application
  NODE_ENV: string;
  
  // Optional but recommended
  NEXT_PUBLIC_API_URL?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
}

const requiredEnvVars: (keyof EnvVars)[] = [
  'MONGODB_URI',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'NODE_ENV',
];

const optionalEnvVars: (keyof EnvVars)[] = [
  'NEXT_PUBLIC_API_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

export function validateEnv(): void {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validating environment variables...');

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      warnings.push(varName);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  });

  // Report missing required variables
  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Create a .env file in the root directory with these variables.');
    console.error('   You can copy .env.example to get started.\n');
    
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Report missing optional variables as warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not set:');
    warnings.forEach((varName) => {
      console.warn(`   - ${varName} (some features may not work)`);
    });
    console.warn('');
  }

  console.log('✅ Environment validation passed\n');
}

// Auto-validate on import in non-browser environments
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // In development, show error but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    } else {
      // In production, crash immediately
      throw error;
    }
  }
}
