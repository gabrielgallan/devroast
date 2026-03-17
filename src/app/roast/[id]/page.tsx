import { RoastResultDisplay } from "@/components/ui/roast-result-display";
import { HydrateClient } from "@/trpc/server";

export const dynamic = "force-dynamic";

interface RoastResultPageProps {
	params: Promise<{ id: string }>;
}

export default async function RoastResultPage({
	params,
}: RoastResultPageProps) {
	const { id } = await params;

	return (
		<HydrateClient>
			<main className="flex flex-col items-center px-20 py-10">
				<RoastResultDisplay submissionId={id} />
			</main>
		</HydrateClient>
	);
}
