import Link from "next/link";

interface NavbarProps {
	className?: string;
}

function Navbar({ className }: NavbarProps) {
	const classes = [
		"flex h-14 items-center justify-between border-b border-border-primary bg-bg-page px-10",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<nav className={classes}>
			<Link href="/" className="flex items-center gap-2">
				<span className="font-mono text-xl font-bold text-accent-green">
					{">"}
				</span>
				<span className="font-mono text-lg font-medium text-text-primary">
					devroast
				</span>
			</Link>
			<Link
				href="/leaderboard"
				className="font-mono text-[13px] text-text-secondary transition-colors hover:text-text-primary"
			>
				leaderboard
			</Link>
		</nav>
	);
}

export { Navbar, type NavbarProps };
