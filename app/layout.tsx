import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CanvasWalletProvider } from "./context/CanvasWalletProvider";
import { ApolloWrapper } from "@/lib/apolloClient";
import { Navbar } from "./component/Navbar";
import ReactQueryProvider from "./context/ReactQueryProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DSCVRY",
  description: "",
  other: {
    "dscvr:canvas:version": "vNext",
    "og:image": "https://my-canvas.com/preview-image.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <ApolloWrapper>
            <CanvasWalletProvider>
              <Navbar />
              <div className="mb-10">{children}</div>
            </CanvasWalletProvider>
          </ApolloWrapper>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
