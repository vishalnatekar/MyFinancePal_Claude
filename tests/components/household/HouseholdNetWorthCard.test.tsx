import { render, screen } from "@testing-library/react";
import { HouseholdNetWorthCard } from "@/components/household/HouseholdNetWorthCard";
import type { SharedAccountWithOwner } from "@/types/household";

describe("HouseholdNetWorthCard", () => {
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
		},
		{
			id: "acc-3",
			account_name: "Credit Card",
			account_type: "credit_card",
			institution_name: "Test Card",
			current_balance: -2000,
			currency: "GBP",
			owner_id: "user-1",
			owner_name: "John Doe",
			sharing_level: "full",
		},
	];

	it("should render the card with correct title", () => {
		render(<HouseholdNetWorthCard accounts={mockAccounts} />);
		expect(screen.getByText("Shared Net Worth")).toBeInTheDocument();
	});

	it("should display the correct total net worth", () => {
		render(<HouseholdNetWorthCard accounts={mockAccounts} />);
		// 5000 + 10000 - 2000 = 13000
		expect(screen.getByText("£13,000.00")).toBeInTheDocument();
	});

	it("should display breakdown by account type", () => {
		render(<HouseholdNetWorthCard accounts={mockAccounts} />);

		// Check for account type labels
		expect(screen.getByText(/Assets/i)).toBeInTheDocument();
		expect(screen.getByText(/Liabilities/i)).toBeInTheDocument();
	});

	it("should handle empty accounts array", () => {
		render(<HouseholdNetWorthCard accounts={[]} />);
		expect(screen.getByText("£0.00")).toBeInTheDocument();
	});

	it("should calculate assets correctly", () => {
		render(<HouseholdNetWorthCard accounts={mockAccounts} />);
		// Assets: checking (5000) + savings (10000) = 15000
		expect(screen.getByText("£15,000.00")).toBeInTheDocument();
	});

	it("should calculate liabilities correctly", () => {
		render(<HouseholdNetWorthCard accounts={mockAccounts} />);
		// Liabilities: credit_card (-2000)
		expect(screen.getByText("£2,000.00")).toBeInTheDocument();
	});

	it("should handle accounts with different currencies", () => {
		const mixedCurrencyAccounts: SharedAccountWithOwner[] = [
			{
				id: "acc-1",
				account_name: "GBP Account",
				account_type: "checking",
				institution_name: "Test Bank",
				current_balance: 1000,
				currency: "GBP",
				owner_id: "user-1",
				owner_name: "John Doe",
				sharing_level: "full",
			},
			{
				id: "acc-2",
				account_name: "USD Account",
				account_type: "savings",
				institution_name: "Test Bank",
				current_balance: 1000,
				currency: "USD",
				owner_id: "user-1",
				owner_name: "John Doe",
				sharing_level: "full",
			},
		];

		render(<HouseholdNetWorthCard accounts={mixedCurrencyAccounts} />);
		// Should still render without crashing
		expect(screen.getByText("Shared Net Worth")).toBeInTheDocument();
	});

	it("should handle negative total net worth", () => {
		const negativeAccounts: SharedAccountWithOwner[] = [
			{
				id: "acc-1",
				account_name: "Credit Card",
				account_type: "credit_card",
				institution_name: "Test Card",
				current_balance: -5000,
				currency: "GBP",
				owner_id: "user-1",
				owner_name: "John Doe",
				sharing_level: "full",
			},
		];

		render(<HouseholdNetWorthCard accounts={negativeAccounts} />);
		expect(screen.getByText("-£5,000.00")).toBeInTheDocument();
	});

	it("should group accounts by type correctly", () => {
		const { container } = render(
			<HouseholdNetWorthCard accounts={mockAccounts} />,
		);

		// Check that the component renders breakdown items
		const breakdown = container.querySelector('[class*="grid"]');
		expect(breakdown).toBeInTheDocument();
	});
});
