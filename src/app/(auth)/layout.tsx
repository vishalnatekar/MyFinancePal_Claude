export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full max-w-md space-y-8 p-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">MyFinancePal</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Your household financial management solution
					</p>
				</div>
				{children}
			</div>
		</div>
	);
}
