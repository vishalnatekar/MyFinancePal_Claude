import {
	type AccountSync,
	AccountSyncStatus,
} from "@/components/dashboard/AccountSyncStatus";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockAccounts: AccountSync[] = [
	{
		accountId: "1",
		accountName: "Checking Account",
		lastSynced: "2024-01-01T12:00:00Z",
		nextSync: "2024-01-01T18:00:00Z",
		status: "active",
	},
	{
		accountId: "2",
		accountName: "Savings Account",
		lastSynced: "2024-01-01T10:00:00Z",
		nextSync: null,
		status: "error",
		error: "Connection expired",
	},
	{
		accountId: "3",
		accountName: "Investment Account",
		lastSynced: null,
		nextSync: null,
		status: "pending",
	},
];

describe("AccountSyncStatus", () => {
	const mockOnRefresh = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should render loading state", () => {
		render(
			<AccountSyncStatus
				accounts={[]}
				onRefresh={mockOnRefresh}
				loading={true}
			/>,
		);

		expect(screen.getByText("Loading sync information...")).toBeInTheDocument();
		const skeletons = document.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("should render all accounts", () => {
		render(
			<AccountSyncStatus accounts={mockAccounts} onRefresh={mockOnRefresh} />,
		);

		expect(screen.getByText("Checking Account")).toBeInTheDocument();
		expect(screen.getByText("Savings Account")).toBeInTheDocument();
		expect(screen.getByText("Investment Account")).toBeInTheDocument();
	});

	it("should display correct status badges", () => {
		render(
			<AccountSyncStatus accounts={mockAccounts} onRefresh={mockOnRefresh} />,
		);

		expect(screen.getByText("active")).toBeInTheDocument();
		expect(screen.getByText("error")).toBeInTheDocument();
		expect(screen.getByText("pending")).toBeInTheDocument();
	});

	it("should show error messages", () => {
		render(
			<AccountSyncStatus accounts={mockAccounts} onRefresh={mockOnRefresh} />,
		);

		expect(screen.getByText("Connection expired")).toBeInTheDocument();
	});

	it("should show last synced time", () => {
		render(
			<AccountSyncStatus accounts={mockAccounts} onRefresh={mockOnRefresh} />,
		);

		// Should show relative time for synced accounts
		const lastSyncedElements = screen.getAllByText(/Last synced:/);
		expect(lastSyncedElements.length).toBeGreaterThan(0);
	});

	it('should show "Never synced" for accounts without sync history', () => {
		render(
			<AccountSyncStatus accounts={mockAccounts} onRefresh={mockOnRefresh} />,
		);

		expect(screen.getByText(/Never synced/)).toBeInTheDocument();
	});

	it("should call onRefresh when sync button clicked", async () => {
		mockOnRefresh.mockResolvedValue(undefined);

		render(
			<AccountSyncStatus accounts={mockAccounts} onRefresh={mockOnRefresh} />,
		);

		const syncButtons = screen.getAllByRole("button", { name: /Sync Now/ });
		fireEvent.click(syncButtons[0]);

		await waitFor(() => {
			expect(mockOnRefresh).toHaveBeenCalledWith("1");
		});
	});

	it("should disable sync button while syncing", async () => {
		mockOnRefresh.mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 100)),
		);

		render(
			<AccountSyncStatus accounts={mockAccounts} onRefresh={mockOnRefresh} />,
		);

		const syncButtons = screen.getAllByRole("button", { name: /Sync Now/ });
		fireEvent.click(syncButtons[0]);

		await waitFor(() => {
			expect(syncButtons[0]).toBeDisabled();
		});
	});

	it("should disable sync button for accounts already syncing", () => {
		const syncingAccounts: AccountSync[] = [
			{
				accountId: "1",
				accountName: "Syncing Account",
				lastSynced: "2024-01-01T12:00:00Z",
				nextSync: null,
				status: "syncing",
			},
		];

		render(
			<AccountSyncStatus
				accounts={syncingAccounts}
				onRefresh={mockOnRefresh}
			/>,
		);

		const syncButton = screen.getByRole("button", { name: /Sync Now/ });
		expect(syncButton).toBeDisabled();
	});

	it("should render empty state when no accounts", () => {
		render(<AccountSyncStatus accounts={[]} onRefresh={mockOnRefresh} />);

		expect(screen.getByText("No accounts to display")).toBeInTheDocument();
	});

	it("should show spinning icon for syncing accounts", () => {
		const syncingAccounts: AccountSync[] = [
			{
				accountId: "1",
				accountName: "Syncing Account",
				lastSynced: "2024-01-01T12:00:00Z",
				nextSync: null,
				status: "syncing",
			},
		];

		render(
			<AccountSyncStatus
				accounts={syncingAccounts}
				onRefresh={mockOnRefresh}
			/>,
		);

		const spinningIcons = document.querySelectorAll(".animate-spin");
		expect(spinningIcons.length).toBeGreaterThan(0);
	});
});
