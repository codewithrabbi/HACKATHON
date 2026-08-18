import type { Metadata } from "next";

import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "OpsPilot AI — From Data to Decisions",
  description:
    "AI-powered Business Operations Platform with anomaly detection, root cause analysis, demand forecasting, and actionable recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-ink text-paper font-body grain relative overflow-x-hidden selection:bg-brass selection:text-ink">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto relative z-10 glow pt-16 md:pt-0">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
