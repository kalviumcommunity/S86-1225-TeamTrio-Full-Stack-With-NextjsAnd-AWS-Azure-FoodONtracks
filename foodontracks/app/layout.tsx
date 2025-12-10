/* app/layout.tsx (Server Component) */
export const metadata = {
  title: "FoodONtracks",
  description: "Batch-based Food Traceability for Indian Railways",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto" }}>
        <header style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <h1 style={{ margin: 0 }}>FoodONtracks</h1>
        </header>

        <main style={{ padding: 24 }}>{children}</main>

        <footer style={{ padding: 16, borderTop: "1px solid #eee" }}>
          © FoodONtracks
        </footer>
      </body>
    </html>
  );
}
