import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persist — Trustless Crypto Inheritance on Sui",
  description:
    "Encrypt a message, document, or crypto instruction. Set a date or a dead man's switch. It unlocks automatically on Walrus — forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
