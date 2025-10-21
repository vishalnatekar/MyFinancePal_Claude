import DashboardPage from "@/app/(dashboard)/page";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/use-dashboard-data", () => ({
	useDashboardData: () => ({
		netWorth: null,
		accounts: [],
		history: [],
		loading: false,
		error: null,
		refetchAll: jest.fn(),
		updateDateRange: jest.fn(),
	}),
}));

jest.mock("@/hooks/use-account-management", () => ({
	useAccountManagement: () => ({
		syncStatus: [],
		managedAccounts: [],
		loading: false,
		error: null,
		handleRefresh: jest.fn(),
		handleRemoveAccount: jest.fn(),
		refetch: jest.fn(),
	}),
}));

// Stub complex child components to keep the test focused on page layout
jest.mock("@/components/dashboard/WelcomeCard", () => ({
	WelcomeCard: () => <div>Welcome Card</div>,
}));

describe("DashboardPage", () => {
	it("renders dashboard tabs", () => {
		render(<DashboardPage />);

		expect(screen.getByText("Welcome Card")).toBeInTheDocument();
		expect(screen.getByText("My Finances")).toBeInTheDocument();
		expect(screen.getByText("Household")).toBeInTheDocument();
	});

	it("shows empty state when no accounts are connected", () => {
		render(<DashboardPage />);

		expect(screen.getByText("Account Management")).toBeInTheDocument();
		expect(screen.getByText("No accounts connected yet")).toBeInTheDocument();
	});
});
