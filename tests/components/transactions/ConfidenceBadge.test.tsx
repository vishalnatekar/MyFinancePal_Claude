/**
 * Tests for ConfidenceBadge Component
 * Story 4.2: Automatic Transaction Categorization
 */

import { render, screen } from "@testing-library/react";
import { ConfidenceBadge } from "@/components/transactions/ConfidenceBadge";

describe("ConfidenceBadge", () => {
	it("should render high confidence badge for score 100", () => {
		render(<ConfidenceBadge confidenceScore={100} />);
		expect(screen.getByText(/Automatically categorized/i)).toBeInTheDocument();
		expect(screen.getByText(/100%/i)).toBeInTheDocument();
	});

	it("should render high confidence badge for score 95", () => {
		render(<ConfidenceBadge confidenceScore={95} />);
		expect(screen.getByText(/Automatically categorized/i)).toBeInTheDocument();
	});

	it("should render medium confidence badge for score 85", () => {
		render(<ConfidenceBadge confidenceScore={85} />);
		expect(screen.getByText(/Categorized by rule/i)).toBeInTheDocument();
	});

	it("should render low confidence badge for score 60", () => {
		render(<ConfidenceBadge confidenceScore={60} />);
		expect(screen.getByText(/Needs review/i)).toBeInTheDocument();
	});

	it("should render none badge for null score", () => {
		render(<ConfidenceBadge confidenceScore={null} />);
		expect(screen.getByText(/Uncategorized/i)).toBeInTheDocument();
	});

	it("should hide text when showText is false", () => {
		render(<ConfidenceBadge confidenceScore={100} showText={false} />);
		expect(
			screen.queryByText(/Automatically categorized/i),
		).not.toBeInTheDocument();
	});
});
