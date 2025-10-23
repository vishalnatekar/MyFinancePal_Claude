/**
 * Tests for CategoryIndicator Component
 * Story 4.2: Automatic Transaction Categorization
 */

import { render, screen } from "@testing-library/react";
import { CategoryIndicator } from "@/components/transactions/CategoryIndicator";
import type { Transaction } from "@/types/transaction";

describe("CategoryIndicator", () => {
	const baseTransaction: Transaction = {
		id: "txn-1",
		account_id: "acc-1",
		amount: -50.0,
		merchant_name: "Test Store",
		category: "groceries",
		date: "2025-10-20",
		is_shared_expense: false,
		manual_override: false,
		created_at: "2025-10-20T10:00:00Z",
	};

	it("should render Personal badge for non-shared transaction", () => {
		render(<CategoryIndicator transaction={baseTransaction} />);
		expect(screen.getByText(/Personal/i)).toBeInTheDocument();
	});

	it("should render Shared badge for shared transaction", () => {
		const sharedTransaction = {
			...baseTransaction,
			is_shared_expense: true,
		};
		render(<CategoryIndicator transaction={sharedTransaction} />);
		expect(screen.getByText(/Shared/i)).toBeInTheDocument();
	});

	it("should render Split badge for split transaction", () => {
		const splitTransaction = {
			...baseTransaction,
			split_details: {
				personal_amount: 20.0,
				shared_amount: 30.0,
				split_percentage: { user1: 50, user2: 50 },
			},
		};
		render(<CategoryIndicator transaction={splitTransaction} />);
		expect(screen.getByText(/Split/i)).toBeInTheDocument();
	});

	it("should prioritize split over shared status", () => {
		const splitSharedTransaction = {
			...baseTransaction,
			is_shared_expense: true,
			split_details: {
				personal_amount: 20.0,
				shared_amount: 30.0,
				split_percentage: { user1: 50, user2: 50 },
			},
		};
		render(<CategoryIndicator transaction={splitSharedTransaction} />);
		expect(screen.getByText(/Split/i)).toBeInTheDocument();
		expect(screen.queryByText(/Shared/i)).not.toBeInTheDocument();
	});
});
