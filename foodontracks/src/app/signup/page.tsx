"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { UserPlus, Train, AlertCircle } from 'lucide-react';

// 1. Define validation schema
const signupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["ADMIN", "RESTAURANT_OWNER", "DELIVERY_GUY", "CUSTOMER"], {
    required_error: "Please select a role",
  }),
  phoneNumber: z.string().optional(),
  restaurantStreet: z.string().optional(),
  restaurantCity: z.string().optional(),
  restaurantState: z.string().optional(),
  restaurantZipCode: z.string().optional(),
}).refine((data) => {
  // If role is RESTAURANT_OWNER, address fields are required
  if (data.role === "RESTAURANT_OWNER") {
    return !!(data.restaurantStreet && data.restaurantCity && data.restaurantState && data.restaurantZipCode);
  }
  return true;
}, {
  message: "All address fields are required for restaurant owners",
  path: ["restaurantStreet"],
}).refine((data) => {
  // If role is DELIVERY_GUY, phone number is required
  if (data.role === "DELIVERY_GUY") {
    return !!data.phoneNumber && data.phoneNumber.trim().length >= 10;
  }
  return true;
}, {
  message: "Phone number is required for delivery agents (minimum 10 digits)",
  path: ["phoneNumber"],
});

// 2. Derive TypeScript types
type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  
  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormData) => {
    setError('');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Signup failed');
      }

      if (result.success) {
        toast.success(`Account created successfully! Welcome, ${data.name}!`);
        reset();
        // Redirect to role-specific dashboard
        router.push(result.redirectUrl || '/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 via-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
            <Train className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800 dark:text-white">
          Create Account
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Sign up to get started with FoodONtracks
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
        >
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Enter your full name"
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              }`}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              }`}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="Create a strong password"
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition dark:bg-gray-700 dark:text-white ${
                errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-orange-500"
              }`}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Select Your Role *
            </label>
            <select
              {...register("role")}
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition dark:bg-gray-700 dark:text-white ${
                errors.role
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-orange-500"
              }`}
              aria-invalid={!!errors.role}
            >
              <option value="">-- Choose Role --</option>
              <option value="CUSTOMER">Customer (Order Food)</option>
              <option value="RESTAURANT_OWNER">Restaurant Owner (Manage Restaurant)</option>
              <option value="DELIVERY_GUY">Delivery Agent (Deliver Orders)</option>
              <option value="ADMIN">Admin (System Administrator)</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.role.message}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Email domain rules:</strong><br/>
              • ADMIN: Must use @admin.com<br/>
              • RESTAURANT_OWNER: Must use @restaurant.com<br/>
              • DELIVERY_GUY: Must use @delivery.com<br/>
              • CUSTOMER: Any valid email
            </p>
          </div>

          {/* Phone Number (Required for Delivery Agent) */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Phone Number {selectedRole === 'DELIVERY_GUY' && <span className="text-red-500">*</span>}
              {selectedRole !== 'DELIVERY_GUY' && <span className="text-gray-500 text-sm">(Optional)</span>}
            </label>
            <input
              type="tel"
              {...register("phoneNumber")}
              placeholder="+1234567890"
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition dark:bg-gray-700 dark:text-white ${
                errors.phoneNumber
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-orange-500"
              }`}
              aria-invalid={!!errors.phoneNumber}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Restaurant Address Fields (Only for Restaurant Owner) */}
          {selectedRole === 'RESTAURANT_OWNER' && (
            <div className="border-t pt-4 mt-2">
              <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-white">
                Restaurant Physical Address
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    {...register("restaurantStreet")}
                    placeholder="123 Main Street"
                    className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                      City *
                    </label>
                    <input
                      type="text"
                      {...register("restaurantCity")}
                      placeholder="New York"
                      className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                      State *
                    </label>
                    <input
                      type="text"
                      {...register("restaurantState")}
                      placeholder="NY"
                      className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    {...register("restaurantZipCode")}
                    placeholder="10001"
                    className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Sign Up</span>
              </>
            )}
          </button>

          {/* Additional Info */}
          <p className="text-sm text-gray-600 text-center mt-2">
            Already have an account?{" "}
            <a href="/login" className="text-orange-600 hover:underline font-semibold">
              Log in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
