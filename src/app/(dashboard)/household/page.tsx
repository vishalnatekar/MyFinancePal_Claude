export default function HouseholdPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Your Households</h1>
				<button
					type="button"
					className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
				>
					Create Household
				</button>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<div className="border rounded-lg p-6 bg-card">
					<h3 className="text-lg font-semibold mb-2">No households yet</h3>
					<p className="text-muted-foreground mb-4">
						Create your first household to start managing shared expenses.
					</p>
					<button
						type="button"
						className="text-primary hover:text-primary/90 text-sm"
					>
						Create your first household →
					</button>
				</div>
			</div>
		</div>
	);
}
