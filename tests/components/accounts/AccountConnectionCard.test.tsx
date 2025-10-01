import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountConnectionCard } from "@/components/accounts/AccountConnectionCard";
import type { FinancialAccount } from "@/types/account";

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
	Building2: () => <div data-testid="building2-icon" />,
	CreditCard: () => <div data-testid="creditcard-icon" />,
	Wallet: () => <div data-testid="wallet-icon" />,
	TrendingUp: () => <div data-testid="trendingup-icon" />,
	MoreVertical: () => <div data-testid="morevertical-icon" />,
	RefreshCw: () => <div data-testid="refresh-icon" />,
	Trash2: () => <div data-testid="trash-icon" />,
	AlertTriangle: () => <div data-testid="alert-icon" />,
	CheckCircle: () => <div data-testid="check-icon" />,
	Clock: () => <div data-testid="clock-icon" />,
	Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className} />,
}));

const mockAccount: FinancialAccount = {
	id: "account-123",
	user_id: "user-123",
	moneyhub_account_id: "mh-account-123",
	moneyhub_connection_id: "mh-connection-123",
	account_type: "checking",
	account_name: "Main Checking",
	institution_name: "Test Bank",
	current_balance: 1500.50,
	is_shared: false,
	last_synced: "2023-01-01T12:00:00Z",
	is_manual: false,
	connection_status: "active",
	created_at: "2023-01-01T10:00:00Z",
	updated_at: "2023-01-01T12:00:00Z",
};

const mockManualAccount: FinancialAccount = {
	...mockAccount,
	id: "manual-account-123",
	is_manual: true,
	moneyhub_account_id: undefined,
	moneyhub_connection_id: undefined,
	connection_status: undefined,
};

const mockExpiredAccount: FinancialAccount = {
	...mockAccount,
	id: "expired-account-123",
	connection_status: "expired",
};

describe("AccountConnectionCard", () => {
	const mockOnSync = jest.fn();
	const mockOnDelete = jest.fn();
	const mockOnReconnect = jest.fn();

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should render account information correctly", () => {
		render(
			<AccountConnectionCard
				account={mockAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		expect(screen.getByText("Main Checking")).toBeInTheDocument();
		expect(screen.getByText("Test Bank")).toBeInTheDocument();
		expect(screen.getByText("£1,500.50")).toBeInTheDocument();
		expect(screen.getByText("Connected")).toBeInTheDocument();
	});

	it("should display correct icon for account type", () => {
		render(
			<AccountConnectionCard
				account={mockAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		expect(screen.getByTestId("creditcard-icon")).toBeInTheDocument();
	});

	it("should show manual badge for manual accounts", () => {
		render(
			<AccountConnectionCard
				account={mockManualAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		expect(screen.getByText("Manual")).toBeInTheDocument();
	});

	it("should show expired status for expired connections", () => {
		render(
			<AccountConnectionCard
				account={mockExpiredAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		expect(screen.getByText("Expired")).toBeInTheDocument();
		expect(screen.getByText(/This account needs to be reconnected/)).toBeInTheDocument();
	});

	it("should show shared badge when account is shared", () => {
		const sharedAccount = { ...mockAccount, is_shared: true };

		render(
			<AccountConnectionCard
				account={sharedAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		expect(screen.getByText("Shared")).toBeInTheDocument();
	});

	it("should format last synced time correctly", () => {
		const recentDate = new Date();
		recentDate.setMinutes(recentDate.getMinutes() - 30); // 30 minutes ago

		const recentAccount = {
			...mockAccount,
			last_synced: recentDate.toISOString(),
		};

		render(
			<AccountConnectionCard
				account={recentAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		expect(screen.getByText(/30 minutes ago/)).toBeInTheDocument();
	});

	it("should handle sync action", async () => {
		const user = userEvent.setup();

		render(
			<AccountConnectionCard
				account={mockAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		// Open dropdown menu
		const menuButton = screen.getByTestId("morevertical-icon").closest("button")!;
		await user.click(menuButton);

		// Click sync option
		const syncButton = screen.getByText("Sync Now");
		await user.click(syncButton);

		expect(mockOnSync).toHaveBeenCalledWith(mockAccount.id);
	});

	it("should not show sync option for manual accounts", async () => {
		const user = userEvent.setup();

		render(
			<AccountConnectionCard
				account={mockManualAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		// Open dropdown menu
		const menuButton = screen.getByTestId("morevertical-icon").closest("button")!;
		await user.click(menuButton);

		// Sync option should not be present
		expect(screen.queryByText("Sync Now")).not.toBeInTheDocument();
	});

	it("should show reconnect option for expired accounts", async () => {
		const user = userEvent.setup();

		render(
			<AccountConnectionCard
				account={mockExpiredAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		// Open dropdown menu
		const menuButton = screen.getByTestId("morevertical-icon").closest("button")!;
		await user.click(menuButton);

		// Should show reconnect option
		expect(screen.getByText("Reconnect")).toBeInTheDocument();
	});

	it("should handle delete action with confirmation", async () => {
		const user = userEvent.setup();

		render(
			<AccountConnectionCard
				account={mockAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		// Open dropdown menu
		const menuButton = screen.getByTestId("morevertical-icon").closest("button")!;
		await user.click(menuButton);

		// Click delete option
		const deleteButton = screen.getByText("Delete Account");
		await user.click(deleteButton);

		// Should show confirmation dialog
		expect(screen.getByText('Are you sure you want to delete "Main Checking"?')).toBeInTheDocument();

		// Confirm deletion
		const confirmButton = screen.getByRole("button", { name: "Delete Account" });
		await user.click(confirmButton);

		expect(mockOnDelete).toHaveBeenCalledWith(mockAccount.id);
	});

	it("should show loading state during operations", async () => {
		mockOnSync.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

		const user = userEvent.setup();

		render(
			<AccountConnectionCard
				account={mockAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		// Open dropdown menu
		const menuButton = screen.getByTestId("morevertical-icon").closest("button")!;
		await user.click(menuButton);

		// Click sync
		const syncButton = screen.getByText("Sync Now");
		await user.click(syncButton);

		// Should show loading state
		expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
	});

	it("should disable buttons during loading", async () => {
		mockOnSync.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

		const user = userEvent.setup();

		render(
			<AccountConnectionCard
				account={mockAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		// Open dropdown menu
		const menuButton = screen.getByTestId("morevertical-icon").closest("button")!;
		await user.click(menuButton);

		// Click sync
		const syncButton = screen.getByText("Sync Now");
		await user.click(syncButton);

		// Menu button should be disabled
		expect(menuButton).toBeDisabled();
	});

	it("should format currency correctly for different amounts", () => {
		const negativeAccount = { ...mockAccount, current_balance: -250.75 };

		render(
			<AccountConnectionCard
				account={negativeAccount}
				onSync={mockOnSync}
				onDelete={mockOnDelete}
				onReconnect={mockOnReconnect}
			/>
		);

		expect(screen.getByText("-£250.75")).toBeInTheDocument();
	});

	it("should handle missing callbacks gracefully", () => {
		render(<AccountConnectionCard account={mockAccount} />);

		expect(screen.getByText("Main Checking")).toBeInTheDocument();
	});
});