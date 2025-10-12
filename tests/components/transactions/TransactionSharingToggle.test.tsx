/**
 * Component tests for TransactionSharingToggle
 * Tests the individual transaction sharing toggle control
 */

import { TransactionSharingToggle } from "@/components/transactions/TransactionSharingToggle";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the transaction sharing service
jest.mock("@/services/transaction-sharing-service", () => ({
	transactionSharingService: {
		updateSharing: jest.fn(),
	},
}));

import { transactionSharingService } from "@/services/transaction-sharing-service";

describe("TransactionSharingToggle", () => {
	const mockTransaction = {
		id: "transaction-1",
		account_id: "account-1",
		amount: -50.0,
		merchant_name: "Tesco",
		category: "groceries",
		date: "2025-01-15",
		is_shared_expense: false,
		shared_with_household_id: null,
		manual_override: false,
		created_at: "2025-01-15T10:00:00Z",
	};

	const mockHouseholds = [
		{ id: "household-1", name: "Family" },
		{ id: "household-2", name: "Roommates" },
	];

	const mockOnChange = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render with private status by default", () => {
			render(
				<TransactionSharingToggle
					transaction={mockTransaction}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			expect(screen.getByText(/Private/i)).toBeInTheDocument();
		});

		it("should show shared status when transaction is shared", () => {
			const sharedTransaction = {
				...mockTransaction,
				is_shared_expense: true,
				shared_with_household_id: "household-1",
			};

			render(
				<TransactionSharingToggle
					transaction={sharedTransaction}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			expect(screen.getByText(/Shared/i)).toBeInTheDocument();
			expect(screen.getByText(/Family/i)).toBeInTheDocument();
		});

		it("should render household selector when clicked", async () => {
			render(
				<TransactionSharingToggle
					transaction={mockTransaction}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			const toggleButton = screen.getByRole("button");
			fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText("Family")).toBeInTheDocument();
				expect(screen.getByText("Roommates")).toBeInTheDocument();
			});
		});
	});

	describe("Sharing Operations", () => {
		it("should share transaction when household is selected", async () => {
			(transactionSharingService.updateSharing as jest.Mock).mockResolvedValue({
				success: true,
				transaction: {
					...mockTransaction,
					is_shared_expense: true,
					shared_with_household_id: "household-1",
				},
			});

			render(
				<TransactionSharingToggle
					transaction={mockTransaction}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			const toggleButton = screen.getByRole("button");
			fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText("Family")).toBeInTheDocument();
			});

			const familyOption = screen.getByText("Family");
			fireEvent.click(familyOption);

			await waitFor(() => {
				expect(transactionSharingService.updateSharing).toHaveBeenCalledWith(
					"transaction-1",
					{
						household_id: "household-1",
						is_shared: true,
					},
				);
				expect(mockOnChange).toHaveBeenCalled();
			});
		});

		it("should unshare transaction when make private is clicked", async () => {
			const sharedTransaction = {
				...mockTransaction,
				is_shared_expense: true,
				shared_with_household_id: "household-1",
			};

			(transactionSharingService.updateSharing as jest.Mock).mockResolvedValue({
				success: true,
				transaction: {
					...mockTransaction,
					is_shared_expense: false,
					shared_with_household_id: null,
				},
			});

			render(
				<TransactionSharingToggle
					transaction={sharedTransaction}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			const toggleButton = screen.getByRole("button");
			fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText(/Make Private/i)).toBeInTheDocument();
			});

			const makePrivateOption = screen.getByText(/Make Private/i);
			fireEvent.click(makePrivateOption);

			await waitFor(() => {
				expect(transactionSharingService.updateSharing).toHaveBeenCalledWith(
					"transaction-1",
					{
						household_id: null,
						is_shared: false,
					},
				);
				expect(mockOnChange).toHaveBeenCalled();
			});
		});

		it("should handle API errors gracefully", async () => {
			const consoleError = jest.spyOn(console, "error").mockImplementation();
			(transactionSharingService.updateSharing as jest.Mock).mockRejectedValue(
				new Error("API Error"),
			);

			render(
				<TransactionSharingToggle
					transaction={mockTransaction}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			const toggleButton = screen.getByRole("button");
			fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText("Family")).toBeInTheDocument();
			});

			const familyOption = screen.getByText("Family");
			fireEvent.click(familyOption);

			await waitFor(() => {
				expect(consoleError).toHaveBeenCalled();
				expect(mockOnChange).not.toHaveBeenCalled();
			});

			consoleError.mockRestore();
		});
	});

	describe("Multiple Households", () => {
		it("should allow switching between households", async () => {
			const sharedWithFamily = {
				...mockTransaction,
				is_shared_expense: true,
				shared_with_household_id: "household-1",
			};

			(transactionSharingService.updateSharing as jest.Mock).mockResolvedValue({
				success: true,
				transaction: {
					...sharedWithFamily,
					shared_with_household_id: "household-2",
				},
			});

			render(
				<TransactionSharingToggle
					transaction={sharedWithFamily}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			const toggleButton = screen.getByRole("button");
			fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText("Roommates")).toBeInTheDocument();
			});

			const roommatesOption = screen.getByText("Roommates");
			fireEvent.click(roommatesOption);

			await waitFor(() => {
				expect(transactionSharingService.updateSharing).toHaveBeenCalledWith(
					"transaction-1",
					{
						household_id: "household-2",
						is_shared: true,
					},
				);
			});
		});

		it("should not render if no households available", () => {
			const { container } = render(
				<TransactionSharingToggle
					transaction={mockTransaction}
					households={[]}
					onChange={mockOnChange}
				/>,
			);

			expect(container.firstChild).toBeNull();
		});
	});

	describe("Loading States", () => {
		it("should show loading state during API call", async () => {
			let resolveUpdate: any;
			(transactionSharingService.updateSharing as jest.Mock).mockReturnValue(
				new Promise((resolve) => {
					resolveUpdate = resolve;
				}),
			);

			render(
				<TransactionSharingToggle
					transaction={mockTransaction}
					households={mockHouseholds}
					onChange={mockOnChange}
				/>,
			);

			const toggleButton = screen.getByRole("button");
			fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText("Family")).toBeInTheDocument();
			});

			const familyOption = screen.getByText("Family");
			fireEvent.click(familyOption);

			// Button should be disabled during update
			await waitFor(() => {
				expect(toggleButton).toBeDisabled();
			});

			// Resolve the promise
			resolveUpdate({
				success: true,
				transaction: { ...mockTransaction, is_shared_expense: true },
			});

			await waitFor(() => {
				expect(toggleButton).not.toBeDisabled();
			});
		});
	});
});
