import {
	AccountManagementSection,
	type ManagedAccount,
} from "@/components/dashboard/AccountManagementSection";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockAccounts: ManagedAccount[] = [
	{
		id: "1",
		accountName: "Checking Account",
		accountType: "checking",
		institution: "Test Bank",
		connectionStatus: "active",
		currentBalance: 5000,
		currency: "GBP",
	},
	{
		id: "2",
		accountName: "Savings Account",
		accountType: "savings",
		institution: "Test Bank",
		connectionStatus: "expired",
		currentBalance: 10000,
		currency: "GBP",
	},
	{
		id: "3",
		accountName: "Credit Card",
		accountType: "credit",
		institution: "Another Bank",
		connectionStatus: "error",
		currentBalance: -1500,
		currency: "GBP",
	},
];

describe("AccountManagementSection", () => {
	const mockOnAddAccount = jest.fn();
	const mockOnRemoveAccount = jest.fn();
	const mockOnReconnect = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should render loading state", () => {
		render(
			<AccountManagementSection
				accounts={[]}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
				loading={true}
			/>,
		);

		expect(screen.getByText("Loading accounts...")).toBeInTheDocument();
		const skeletons = document.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("should render all accounts", () => {
		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		expect(screen.getByText("Checking Account")).toBeInTheDocument();
		expect(screen.getByText("Savings Account")).toBeInTheDocument();
		expect(screen.getByText("Credit Card")).toBeInTheDocument();
	});

	it("should display account details correctly", () => {
		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		expect(screen.getByText("Test Bank • checking")).toBeInTheDocument();
		expect(screen.getByText("Another Bank • credit")).toBeInTheDocument();
		expect(screen.getByText(/Balance: £5,000/)).toBeInTheDocument();
	});

	it("should show connection status badges", () => {
		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		expect(screen.getByText("active")).toBeInTheDocument();
		expect(screen.getByText("expired")).toBeInTheDocument();
		expect(screen.getByText("error")).toBeInTheDocument();
	});

	it("should show reconnect button for expired accounts", () => {
		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		const reconnectButton = screen.getByRole("button", {
			name: /Reconnect Account/,
		});
		expect(reconnectButton).toBeInTheDocument();

		fireEvent.click(reconnectButton);
		expect(mockOnReconnect).toHaveBeenCalledWith("2");
	});

	it("should call onAddAccount when add button clicked", () => {
		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		const addButtons = screen.getAllByRole("button", { name: /Add Account/ });
		fireEvent.click(addButtons[0]);

		expect(mockOnAddAccount).toHaveBeenCalled();
	});

	it("should show delete confirmation dialog", async () => {
		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		// Click delete button for first account
		const deleteButtons = screen.getAllByRole("button");
		const trashButton = deleteButtons.find((btn) =>
			btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
		);

		if (trashButton) {
			fireEvent.click(trashButton);
		}

		await waitFor(() => {
			expect(screen.getByText("Remove Account")).toBeInTheDocument();
			expect(
				screen.getByText(/This action cannot be undone/),
			).toBeInTheDocument();
		});
	});

	it("should call onRemoveAccount when deletion confirmed", async () => {
		mockOnRemoveAccount.mockResolvedValue(undefined);

		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		// Click delete button
		const deleteButtons = screen.getAllByRole("button");
		const trashButton = deleteButtons.find((btn) =>
			btn.querySelector("svg")?.classList.contains("lucide-trash-2"),
		);

		if (trashButton) {
			fireEvent.click(trashButton);
		}

		// Confirm deletion
		await waitFor(() => {
			const confirmButton = screen.getByRole("button", {
				name: /Remove Account/,
			});
			fireEvent.click(confirmButton);
		});

		await waitFor(() => {
			expect(mockOnRemoveAccount).toHaveBeenCalled();
		});
	});

	it("should render empty state when no accounts", () => {
		render(
			<AccountManagementSection
				accounts={[]}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		expect(screen.getByText("No accounts connected yet")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Connect Your First Account/ }),
		).toBeInTheDocument();
	});

	it("should format currency correctly", () => {
		render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		expect(screen.getByText(/£5,000/)).toBeInTheDocument();
		expect(screen.getByText(/£10,000/)).toBeInTheDocument();
	});

	it("should highlight non-active accounts with different styling", () => {
		const { container } = render(
			<AccountManagementSection
				accounts={mockAccounts}
				onAddAccount={mockOnAddAccount}
				onRemoveAccount={mockOnRemoveAccount}
				onReconnect={mockOnReconnect}
			/>,
		);

		const accountCards = container.querySelectorAll(".p-4.border.rounded-lg");
		// Should have some cards with bg-accent/20 class for non-active accounts
		const highlightedCards = Array.from(accountCards).filter((card) =>
			card.className.includes("bg-accent"),
		);
		expect(highlightedCards.length).toBeGreaterThan(0);
	});
});
