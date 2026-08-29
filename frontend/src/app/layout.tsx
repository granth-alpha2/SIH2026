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
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const m = localStorage.getItem('agriprofit_mode') || (localStorage.getItem('agriprofit_theme') === 'night' ? 'night' : 'day');
                const ec = localStorage.getItem('agriprofit_eyecare') === 'true' || localStorage.getItem('agriprofit_theme') === 'eyecare';
                const t = ec ? m + '-eyecare' : m;
                document.documentElement.setAttribute('data-theme', t);
                document.documentElement.setAttribute('data-mode', m);
                document.documentElement.setAttribute('data-eyecare', ec ? 'true' : 'false');
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

