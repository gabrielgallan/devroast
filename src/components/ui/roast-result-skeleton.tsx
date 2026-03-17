export function RoastResultSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			{/* Score & Verdict Section */}
			<div className="flex flex-col gap-4">
				<div className="h-32 w-32 rounded-full bg-bg-elevated animate-pulse" />
				<div className="h-6 w-48 rounded bg-bg-elevated animate-pulse" />
			</div>

			{/* Roast Text */}
			<div className="space-y-2">
				<div className="h-4 w-full rounded bg-bg-elevated animate-pulse" />
				<div className="h-4 w-5/6 rounded bg-bg-elevated animate-pulse" />
				<div className="h-4 w-4/6 rounded bg-bg-elevated animate-pulse" />
			</div>

			{/* Issues Section */}
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="space-y-2 border-l-4 border-border-primary pl-4"
					>
						<div className="h-5 w-40 rounded bg-bg-elevated animate-pulse" />
						<div className="h-4 w-full rounded bg-bg-elevated animate-pulse" />
					</div>
				))}
			</div>

			{/* Diff Section */}
			<div className="space-y-2 font-mono text-sm">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="h-5 w-full rounded bg-bg-elevated animate-pulse"
					/>
				))}
			</div>
		</div>
	);
}
