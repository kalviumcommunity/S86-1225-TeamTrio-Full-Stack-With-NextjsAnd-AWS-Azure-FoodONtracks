"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 1. Define validation schema
const signupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// 2. Derive TypeScript types
type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    console.log("Form Submitted:", data);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`Welcome, ${data.name}!`);
    reset(); // Clear form after submission
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800 dark:text-white">
          Create Account
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Sign up to get started with FoodOnTracks
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
        >
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
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span>
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
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="Create a strong password"
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition mt-2"
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>

          {/* Additional Info */}
          <p className="text-sm text-gray-600 text-center mt-2">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Log in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
