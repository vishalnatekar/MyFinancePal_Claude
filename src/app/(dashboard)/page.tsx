import { EmptyState } from "@/components/dashboard/EmptyState";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
	return (
		<div className="space-y-6">
			<Breadcrumb />
			<WelcomeCard />

			<Tabs defaultValue="finances" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="finances">My Finances</TabsTrigger>
					<TabsTrigger value="household">Household</TabsTrigger>
				</TabsList>

				<TabsContent value="finances" className="space-y-4">
					<EmptyState
						icon="💰"
						title="No financial accounts yet"
						description="Connect your bank accounts and start tracking your finances."
						actionText="Add Account"
						actionHref="/accounts"
					/>
				</TabsContent>

				<TabsContent value="household" className="space-y-4">
					<EmptyState
						icon="🏠"
						title="No household created"
						description="Create or join a household to manage shared expenses with others."
						actionText="Create Household"
						actionHref="/household/create"
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
