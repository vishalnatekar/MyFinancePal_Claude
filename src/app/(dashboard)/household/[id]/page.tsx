interface HouseholdDetailPageProps {
	params: {
		id: string;
	};
}

export default function HouseholdDetailPage({
	params,
}: HouseholdDetailPageProps) {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Household Details</h1>
				<div className="flex space-x-4">
					<button
						type="button"
						className="px-4 py-2 border rounded-md hover:bg-muted"
					>
						Invite Members
					</button>
					<button
						type="button"
						className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
					>
						Add Expense
					</button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="md:col-span-2 space-y-6">
					<div className="bg-card border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
						<p className="text-muted-foreground">
							No expenses yet. Add your first expense to get started.
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<div className="bg-card border rounded-lg p-6">
						<h3 className="text-lg font-semibold mb-4">Household Members</h3>
						<p className="text-muted-foreground">Household ID: {params.id}</p>
					</div>

					<div className="bg-card border rounded-lg p-6">
						<h3 className="text-lg font-semibold mb-4">Balance Summary</h3>
						<p className="text-muted-foreground">All settled up! 🎉</p>
					</div>
				</div>
			</div>
		</div>
	);
}
