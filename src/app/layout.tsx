import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import "./globals.css";

export const metadata: Metadata = {
	title: "DevRoast",
	description: "Paste your code. Get roasted.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body className="bg-bg-page text-text-primary antialiased">
				<Navbar />
				{children}
			</body>
		</html>
	);
}
