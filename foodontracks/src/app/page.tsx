// app/page.tsx
"use client";

import Button from "./components/Button";

export default function Home() {
  const handleClick = () => {
    alert("Demo button works!");
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto',
      }}
    >
      <h2>FoodONtracks — Starter</h2>
      <p>Your batch traceability system is running!</p>

      <div style={{ marginTop: 16 }}>
        <Button onClick={handleClick}>Click Me</Button>
      </div>
    </div>
  );
}
