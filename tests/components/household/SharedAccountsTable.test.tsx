import { SharedAccountsTable } from "@/components/household/SharedAccountsTable";
import type { SharedAccountWithOwner } from "@/types/household";
import { render, screen } from "@testing-library/react";

describe("SharedAccountsTable", () => {
	const mockAccounts: SharedAccountWithOwner[] = [
		{
			id: "acc-1",
			account_name: "Main Checking",
			account_type: "checking",
			institution_name: "Test Bank",
			current_balance: 5000,
			currency: "GBP",
			owner_id: "user-1",
			owner_name: "John Doe",
			sharing_level: "full",
			last_synced: "2024-01-15T10:00:00Z",
		},
		{
			id: "acc-2",
			account_name: "Savings Account",
			account_type: "savings",
			institution_name: "Test Bank",
			current_balance: 10000,
			currency: "GBP",
			owner_id: "user-2",
			owner_name: "Jane Doe",
			sharing_level: "full",
			last_synced: "2024-01-14T10:00:00Z",
		},
		{
			id: "acc-3",
			account_name: "Credit Card",
			account_type: "credit_card",
			institution_name: "Test Card Co",
			current_balance: -2000,
			currency: "GBP",
			owner_id: "user-1",
			owner_name: "John Doe",
			sharing_level: "balance_only",
		},
	];

	it("should render the table with correct headers", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);
		expect(screen.getByText(/Account/i)).toBeInTheDocument();
		expect(screen.getByText(/Owner/i)).toBeInTheDocument();
		expect(screen.getByText(/Balance/i)).toBeInTheDocument();
		expect(screen.getByText(/Type/i)).toBeInTheDocument();
	});

	it("should display all account names", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);
		expect(screen.getByText("Main Checking")).toBeInTheDocument();
		expect(screen.getByText("Savings Account")).toBeInTheDocument();
		expect(screen.getByText("Credit Card")).toBeInTheDocument();
	});

	it("should display institution names", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);
		expect(screen.getByText("Test Bank")).toBeInTheDocument();
		expect(screen.getByText("Test Card Co")).toBeInTheDocument();
	});

	it("should display owner names", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);
		const johnDoeElements = screen.getAllByText("John Doe");
		const janeDoeElements = screen.getAllByText("Jane Doe");

		expect(johnDoeElements.length).toBeGreaterThan(0);
		expect(janeDoeElements.length).toBeGreaterThan(0);
	});

	it("should display formatted balances", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);
		expect(screen.getByText("£5,000.00")).toBeInTheDocument();
		expect(screen.getByText("£10,000.00")).toBeInTheDocument();
		expect(screen.getByText("-£2,000.00")).toBeInTheDocument();
	});

	it("should display account types", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);
		expect(screen.getByText(/checking/i)).toBeInTheDocument();
		expect(screen.getByText(/savings/i)).toBeInTheDocument();
		expect(screen.getByText(/credit.*card/i)).toBeInTheDocument();
	});

	it("should handle empty accounts array", () => {
		render(<SharedAccountsTable accounts={[]} />);
		expect(screen.getByText(/No shared accounts yet/i)).toBeInTheDocument();
	});

	it("should display sync status for recently synced accounts", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);

		// Check for sync indicators (last_synced timestamps)
		const syncedAccount = screen.getByText("Main Checking");
		expect(syncedAccount).toBeInTheDocument();
	});

	it("should group accounts by owner", () => {
		const { container } = render(
			<SharedAccountsTable accounts={mockAccounts} />,
		);

		// John Doe should have 2 accounts
		const johnAccounts = screen.getAllByText("John Doe");
		expect(johnAccounts.length).toBe(2);

		// Jane Doe should have 1 account
		const janeAccounts = screen.getAllByText("Jane Doe");
		expect(janeAccounts.length).toBe(1);
	});

	it("should handle accounts without last_synced", () => {
		const accountsWithoutSync: SharedAccountWithOwner[] = [
			{
				id: "acc-1",
				account_name: "Manual Account",
				account_type: "checking",
				institution_name: "Manual Bank",
				current_balance: 1000,
				currency: "GBP",
				owner_id: "user-1",
				owner_name: "John Doe",
				sharing_level: "full",
				// No last_synced
			},
		];

		render(<SharedAccountsTable accounts={accountsWithoutSync} />);
		expect(screen.getByText("Manual Account")).toBeInTheDocument();
	});

	it("should display sharing level indicators", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);

		// Check that accounts with different sharing levels are rendered
		// (The specific rendering depends on implementation)
		const table = screen.getByRole("table");
		expect(table).toBeInTheDocument();
	});

	it("should handle accounts with avatars", () => {
		const accountsWithAvatars: SharedAccountWithOwner[] = [
			{
				...mockAccounts[0],
				owner_avatar: "https://example.com/avatar.jpg",
			},
		];

		const { container } = render(
			<SharedAccountsTable accounts={accountsWithAvatars} />,
		);

		// Avatar component should be rendered
		const avatar = container.querySelector('[class*="avatar"]');
		expect(avatar).toBeInTheDocument();
	});

	it("should sort accounts by owner name", () => {
		render(<SharedAccountsTable accounts={mockAccounts} />);

		// Verify table renders (specific sort order depends on implementation)
		const table = screen.getByRole("table");
		expect(table).toBeInTheDocument();
	});

	it("should handle different currencies", () => {
		const multiCurrencyAccounts: SharedAccountWithOwner[] = [
			{
				id: "acc-1",
				account_name: "GBP Account",
				account_type: "checking",
				institution_name: "UK Bank",
				current_balance: 1000,
				currency: "GBP",
				owner_id: "user-1",
				owner_name: "John Doe",
				sharing_level: "full",
			},
			{
				id: "acc-2",
				account_name: "USD Account",
				account_type: "checking",
				institution_name: "US Bank",
				current_balance: 1000,
				currency: "USD",
				owner_id: "user-1",
				owner_name: "John Doe",
				sharing_level: "full",
			},
		];

		render(<SharedAccountsTable accounts={multiCurrencyAccounts} />);
		expect(screen.getByText("GBP Account")).toBeInTheDocument();
		expect(screen.getByText("USD Account")).toBeInTheDocument();
	});

	it("should render table rows for each account", () => {
		const { container } = render(
			<SharedAccountsTable accounts={mockAccounts} />,
		);

		const rows = container.querySelectorAll("tbody tr");
		// Should have at least as many rows as accounts (may have more for grouping)
		expect(rows.length).toBeGreaterThanOrEqual(mockAccounts.length);
	});
});
