import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Culinary Lab Book",
  description:
    "Turn what cooks say while they cook into recipes others can repeat.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
          <header className="border-b border-stone-200 bg-white">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-semibold tracking-tight">
                Culinary Lab Book
              </Link>
              <Show when="signed-in">
                <UserButton />
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-stone-900 active:bg-stone-200">
                    Sign in
                  </button>
                </SignInButton>
              </Show>
            </div>
          </header>
          <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
