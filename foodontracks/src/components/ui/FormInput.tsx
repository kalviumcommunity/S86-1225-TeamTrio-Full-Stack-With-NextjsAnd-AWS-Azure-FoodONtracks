import { UseFormRegister, FieldValues } from "react-hook-form";

interface FormInputProps {
  label: string;
  type?: string;
  register: UseFormRegister<FieldValues>;
  name: string;
  error?: string;
  placeholder?: string;
}

export default function FormInput({
  label,
  type = "text",
  register,
  name,
  error,
  placeholder,
}: FormInputProps) {
  return (
    <div className="mb-3">
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        {...register(name)}
        placeholder={placeholder}
        className={`w-full border p-2 rounded focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
        }`}
        aria-invalid={!!error}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
