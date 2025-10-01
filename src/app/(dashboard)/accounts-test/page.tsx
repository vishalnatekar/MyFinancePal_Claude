export default function AccountsTestPage() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold">Accounts Test Page</h1>
			<p>If you can see this, routing is working!</p>
			<p>
				Now try:{" "}
				<a href="/accounts" className="text-blue-500 underline">
					/accounts
				</a>
			</p>
		</div>
	);
}
