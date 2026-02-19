import "~/styles/globals.css";
import { type Metadata } from "next";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "AI Bug Triage",
  description: "Simple AI-powered bug tracking",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* Using standard sans-serif system fonts */}
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}