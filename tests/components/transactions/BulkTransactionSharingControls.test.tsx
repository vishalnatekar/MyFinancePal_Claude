/**
 * Component tests for BulkTransactionSharingControls
 * Tests bulk transaction sharing operations
 */

import { BulkTransactionSharingControls } from "@/components/transactions/BulkTransactionSharingControls";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the transaction sharing service
jest.mock("@/services/transaction-sharing-service", () => ({
	transactionSharingService: {
		bulkUpdateSharing: jest.fn(),
	},
}));

import { transactionSharingService } from "@/services/transaction-sharing-service";

describe("BulkTransactionSharingControls", () => {
	const mockHouseholds = [
		{ id: "household-1", name: "Family" },
		{ id: "household-2", name: "Roommates" },
	];

	const mockOnComplete = jest.fn();
	const mockOnClearSelection = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should not render when no transactions are selected", () => {
			const { container } = render(
				<BulkTransactionSharingControls
					selectedTransactionIds={[]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			expect(container.firstChild).toBeNull();
		});

		it("should render toolbar when transactions are selected", () => {
			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2", "tx-3"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			expect(screen.getByText("3 transactions selected")).toBeInTheDocument();
		});

		it("should show household selector and action buttons", () => {
			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			expect(screen.getByText(/Select household/i)).toBeInTheDocument();
			expect(screen.getByText(/Share/i)).toBeInTheDocument();
			expect(screen.getByText(/Make Private/i)).toBeInTheDocument();
		});

		it("should render singular text for one transaction", () => {
			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			expect(screen.getByText("1 transaction selected")).toBeInTheDocument();
		});
	});

	describe("Bulk Sharing", () => {
		it("should share selected transactions with chosen household", async () => {
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockResolvedValue({
				success_count: 3,
				failed_count: 0,
				errors: [],
			});

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2", "tx-3"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			// Select household
			const householdSelect = screen.getByRole("combobox");
			fireEvent.change(householdSelect, { target: { value: "household-1" } });

			// Click Share button
			const shareButton = screen.getByText(/Share/i);
			fireEvent.click(shareButton);

			await waitFor(() => {
				expect(
					transactionSharingService.bulkUpdateSharing,
				).toHaveBeenCalledWith({
					transaction_ids: ["tx-1", "tx-2", "tx-3"],
					household_id: "household-1",
					is_shared: true,
				});
				expect(mockOnComplete).toHaveBeenCalled();
				expect(mockOnClearSelection).toHaveBeenCalled();
			});
		});

		it("should require household selection before sharing", async () => {
			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			// Try to share without selecting household
			const shareButton = screen.getByText(/Share/i);
			fireEvent.click(shareButton);

			// Should show error or disable button
			await waitFor(() => {
				expect(
					transactionSharingService.bulkUpdateSharing,
				).not.toHaveBeenCalled();
			});
		});

		it("should handle partial success responses", async () => {
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockResolvedValue({
				success_count: 2,
				failed_count: 1,
				errors: [
					{
						transaction_id: "tx-3",
						error: "You do not own this transaction",
					},
				],
			});

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2", "tx-3"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			const householdSelect = screen.getByRole("combobox");
			fireEvent.change(householdSelect, { target: { value: "household-1" } });

			const shareButton = screen.getByText(/Share/i);
			fireEvent.click(shareButton);

			await waitFor(() => {
				expect(mockOnComplete).toHaveBeenCalled();
				// Should show error message about partial success
				expect(screen.getByText(/1 failed/i)).toBeInTheDocument();
			});
		});
	});

	describe("Bulk Unsharing", () => {
		it("should make selected transactions private", async () => {
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockResolvedValue({
				success_count: 2,
				failed_count: 0,
				errors: [],
			});

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			const makePrivateButton = screen.getByText(/Make Private/i);
			fireEvent.click(makePrivateButton);

			await waitFor(() => {
				expect(
					transactionSharingService.bulkUpdateSharing,
				).toHaveBeenCalledWith({
					transaction_ids: ["tx-1", "tx-2"],
					household_id: null,
					is_shared: false,
				});
				expect(mockOnComplete).toHaveBeenCalled();
				expect(mockOnClearSelection).toHaveBeenCalled();
			});
		});

		it("should not require household selection for unsharing", async () => {
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockResolvedValue({
				success_count: 1,
				failed_count: 0,
				errors: [],
			});

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			// Click Make Private without selecting household
			const makePrivateButton = screen.getByText(/Make Private/i);
			fireEvent.click(makePrivateButton);

			await waitFor(() => {
				expect(transactionSharingService.bulkUpdateSharing).toHaveBeenCalled();
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle API errors gracefully", async () => {
			const consoleError = jest.spyOn(console, "error").mockImplementation();
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockRejectedValue(new Error("Network error"));

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			const householdSelect = screen.getByRole("combobox");
			fireEvent.change(householdSelect, { target: { value: "household-1" } });

			const shareButton = screen.getByText(/Share/i);
			fireEvent.click(shareButton);

			await waitFor(() => {
				expect(consoleError).toHaveBeenCalled();
				expect(screen.getByText(/Failed to update/i)).toBeInTheDocument();
			});

			consoleError.mockRestore();
		});

		it("should display all errors when multiple transactions fail", async () => {
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockResolvedValue({
				success_count: 0,
				failed_count: 2,
				errors: [
					{ transaction_id: "tx-1", error: "Transaction not found" },
					{ transaction_id: "tx-2", error: "Not authorized" },
				],
			});

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			const householdSelect = screen.getByRole("combobox");
			fireEvent.change(householdSelect, { target: { value: "household-1" } });

			const shareButton = screen.getByText(/Share/i);
			fireEvent.click(shareButton);

			await waitFor(() => {
				expect(screen.getByText(/2 failed/i)).toBeInTheDocument();
			});
		});
	});

	describe("Loading States", () => {
		it("should disable buttons during bulk operation", async () => {
			let resolveBulkUpdate: any;
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockReturnValue(
				new Promise((resolve) => {
					resolveBulkUpdate = resolve;
				}),
			);

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			const householdSelect = screen.getByRole("combobox");
			fireEvent.change(householdSelect, { target: { value: "household-1" } });

			const shareButton = screen.getByText(/Share/i);
			fireEvent.click(shareButton);

			// Buttons should be disabled
			await waitFor(() => {
				expect(shareButton).toBeDisabled();
			});

			// Resolve the promise
			resolveBulkUpdate({
				success_count: 2,
				failed_count: 0,
				errors: [],
			});

			await waitFor(() => {
				expect(mockOnComplete).toHaveBeenCalled();
			});
		});

		it("should show progress indicator during operation", async () => {
			let resolveBulkUpdate: any;
			(
				transactionSharingService.bulkUpdateSharing as jest.Mock
			).mockReturnValue(
				new Promise((resolve) => {
					resolveBulkUpdate = resolve;
				}),
			);

			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2", "tx-3"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			const householdSelect = screen.getByRole("combobox");
			fireEvent.change(householdSelect, { target: { value: "household-1" } });

			const shareButton = screen.getByText(/Share/i);
			fireEvent.click(shareButton);

			// Should show loading state
			await waitFor(() => {
				expect(screen.getByText(/Updating/i)).toBeInTheDocument();
			});

			resolveBulkUpdate({
				success_count: 3,
				failed_count: 0,
				errors: [],
			});
		});
	});

	describe("Clear Selection", () => {
		it("should call onClearSelection when cancel is clicked", () => {
			render(
				<BulkTransactionSharingControls
					selectedTransactionIds={["tx-1", "tx-2"]}
					households={mockHouseholds}
					onComplete={mockOnComplete}
					onClearSelection={mockOnClearSelection}
				/>,
			);

			const cancelButton = screen.getByText(/Cancel/i);
			fireEvent.click(cancelButton);

			expect(mockOnClearSelection).toHaveBeenCalled();
		});
	});
});
