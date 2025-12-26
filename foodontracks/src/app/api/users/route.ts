import { NextResponse } from "next/server";

// Mock users data for demo purposes
const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "user" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "admin" },
  { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "restaurant" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", role: "delivery" },
  { id: 5, name: "Charlie Davis", email: "charlie@example.com", role: "user" },
  { id: 6, name: "Diana Evans", email: "diana@example.com", role: "user" },
  {
    id: 7,
    name: "Frank Miller",
    email: "frank@example.com",
    role: "restaurant",
  },
  { id: 8, name: "Grace Lee", email: "grace@example.com", role: "admin" },
];

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log("📡 Fetching users from mock data");

  return NextResponse.json({
    data: mockUsers,
    total: mockUsers.length,
    timestamp: new Date().toISOString(),
  });
}
