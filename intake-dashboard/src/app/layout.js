import './globals.css';

export const metadata = {
  title: 'Dankley Universal Inventory Intake Engine',
  description: 'Multi-tenant, POS-agnostic cannabis inventory intake orchestrator powered by Google Gemini Vision.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
