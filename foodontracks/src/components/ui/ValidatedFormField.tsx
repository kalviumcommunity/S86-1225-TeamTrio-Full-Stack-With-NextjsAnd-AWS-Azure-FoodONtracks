"use client";

import React, { useState, useEffect } from 'react';

interface FormFieldProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  validations?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
  placeholder?: string;
}

export const ValidatedFormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  validations,
  placeholder,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) return;

    const validateField = () => {
      if (!validations) {
        setError(null);
        return;
      }

      // Required validation
      if (validations.required && !value.trim()) {
        setError(`${label} is required`);
        return;
      }

      // Min length validation
      if (validations.minLength && value.length < validations.minLength) {
        setError(`${label} must be at least ${validations.minLength} characters`);
        return;
      }

      // Max length validation
      if (validations.maxLength && value.length > validations.maxLength) {
        setError(`${label} must be at most ${validations.maxLength} characters`);
        return;
      }

      // Pattern validation
      if (validations.pattern && !validations.pattern.test(value)) {
        setError(`${label} format is invalid`);
        return;
      }

      // Custom validation
      if (validations.custom) {
        const customError = validations.custom(value);
        if (customError) {
          setError(customError);
          return;
        }
      }

      setError(null);
    };

    validateField();
  }, [value, validations, label, touched]);

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label}
        {validations?.required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
        } dark:bg-gray-800 dark:text-white`}
      />
      {error && touched && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
      {!error && touched && value && (
        <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <span>✓</span>
          Valid
        </p>
      )}
    </div>
  );
};

// Example usage component
export const ExampleValidatedForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Validated Form Example</h2>

      <ValidatedFormField
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        validations={{
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        }}
        placeholder="Enter your email"
      />

      <ValidatedFormField
        label="Username"
        name="username"
        value={formData.username}
        onChange={(value) => setFormData({ ...formData, username: value })}
        validations={{
          required: true,
          minLength: 3,
          maxLength: 20,
          pattern: /^[a-zA-Z0-9_]+$/,
        }}
        placeholder="Enter username"
      />

      <ValidatedFormField
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={(value) => setFormData({ ...formData, password: value })}
        validations={{
          required: true,
          minLength: 8,
          custom: (value) => {
            if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
            if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
            if (!/[0-9]/.test(value)) return 'Password must contain a number';
            return null;
          },
        }}
        placeholder="Enter password"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-4"
      >
        Submit
      </button>
    </form>
  );
};
