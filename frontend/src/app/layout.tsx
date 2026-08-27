import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./shell.css";

export const metadata: Metadata = {
  title: "AgriProfit | Better harvests, planned",
  description: "An explainable crop and farm profit planning workspace.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
