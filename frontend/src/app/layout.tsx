import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VulnScanner Dashboard",
  description: "Security Portfolio Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="dark">
      <body className={`${inter.className} dark:bg-background dark:text-foreground`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
