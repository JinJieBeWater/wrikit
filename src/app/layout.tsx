import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Provider as WrapBalancerProvider } from "react-wrap-balancer";
import { auth } from "@/server/auth";
import { SessionProvider } from "@/components/provider/session-provider";

export const metadata: Metadata = {
  title: "Wrikit",
  description: "a tool for writing",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WrapBalancerProvider>
            <TRPCReactProvider>
              <SessionProvider session={session}>{children}</SessionProvider>
              <Toaster />
            </TRPCReactProvider>
          </WrapBalancerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
