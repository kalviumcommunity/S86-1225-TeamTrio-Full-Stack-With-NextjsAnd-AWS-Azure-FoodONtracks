"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/ui/FormInput";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { AlertTriangle } from "lucide-react";

// Define validation schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    logger.info("contact_form_submitted", { context: { data } });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Message Sent Successfully!");
    reset();
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-linear-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800 dark:text-white">
          Contact Us
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Have questions? We&apos;d love to hear from you!
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
        >
          {/* Using Reusable FormInput Component */}
          <FormInput
            label="Your Name"
            name="name"
            register={register as any}
            error={errors.name?.message}
            placeholder="John Doe"
          />

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            register={register as any}
            error={errors.email?.message}
            placeholder="john@example.com"
          />

          <FormInput
            label="Subject"
            name="subject"
            register={register as any}
            error={errors.subject?.message}
            placeholder="What's this about?"
          />

          {/* Message Field (Textarea) */}
          <div className="mb-3">
            <label className="block mb-2 font-medium text-gray-700">
              Message
            </label>
            <textarea
              {...register("message")}
              placeholder="Tell us more..."
              rows={5}
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition resize-none ${
                errors.message
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!errors.message}
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition mt-4"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-green-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
