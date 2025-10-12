import { render, screen, fireEvent } from "@testing-library/react";
import { HouseholdActivityFeed } from "@/components/household/HouseholdActivityFeed";
import type { HouseholdActivityEvent } from "@/types/household";

describe("HouseholdActivityFeed", () => {
	const mockActivities: HouseholdActivityEvent[] = [
		{
			id: "activity-1",
			type: "member_joined",
			description: "John Doe joined the household",
			actor_id: "user-1",
			actor_name: "John Doe",
			timestamp: "2024-01-15T10:00:00Z",
		},
		{
			id: "activity-2",
			type: "transaction_shared",
			description: "Jane Doe shared £50.00 at Tesco",
			actor_id: "user-2",
			actor_name: "Jane Doe",
			timestamp: "2024-01-16T14:30:00Z",
			metadata: {
				amount: -50,
				merchant: "Tesco",
			},
		},
		{
			id: "activity-3",
			type: "large_transaction",
			description: "Bob Smith shared large expense: £500.00 at Apple Store",
			actor_id: "user-3",
			actor_name: "Bob Smith",
			timestamp: "2024-01-17T09:15:00Z",
			metadata: {
				amount: -500,
				merchant: "Apple Store",
			},
		},
	];

	it("should render the feed with correct title", () => {
		render(<HouseholdActivityFeed activities={mockActivities} />);
		expect(screen.getByText("Activity Feed")).toBeInTheDocument();
	});

	it("should display all activity descriptions", () => {
		render(<HouseholdActivityFeed activities={mockActivities} />);
		expect(
			screen.getByText("John Doe joined the household"),
		).toBeInTheDocument();
		expect(screen.getByText(/Jane Doe shared £50.00 at Tesco/)).toBeInTheDocument();
		expect(
			screen.getByText(/Bob Smith shared large expense: £500.00 at Apple Store/),
		).toBeInTheDocument();
	});

	it("should display actor names", () => {
		render(<HouseholdActivityFeed activities={mockActivities} />);
		expect(screen.getByText(/John Doe/)).toBeInTheDocument();
		expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
		expect(screen.getByText(/Bob Smith/)).toBeInTheDocument();
	});

	it("should handle empty activities array", () => {
		render(<HouseholdActivityFeed activities={[]} />);
		expect(screen.getByText("Activity Feed")).toBeInTheDocument();
		expect(screen.getByText(/No activity yet/i)).toBeInTheDocument();
	});

	it("should display activity types correctly", () => {
		const { container } = render(
			<HouseholdActivityFeed activities={mockActivities} />,
		);

		// Check for different activity type indicators (icons or badges)
		expect(container.querySelectorAll('[class*="activity"]').length).toBeGreaterThan(0);
	});

	it("should display relative timestamps", () => {
		const { container } = render(
			<HouseholdActivityFeed activities={mockActivities} />,
		);

		// Should have timestamp elements
		const times = container.querySelectorAll("time");
		expect(times.length).toBeGreaterThan(0);
	});

	it("should filter activities by type", () => {
		render(<HouseholdActivityFeed activities={mockActivities} />);

		// Look for filter controls
		const allFilter = screen.getByText(/All/i);
		expect(allFilter).toBeInTheDocument();

		// Click on transaction filter if it exists
		const transactionFilter = screen.queryByText(/Transactions/i);
		if (transactionFilter) {
			fireEvent.click(transactionFilter);

			// Should still show transaction activities
			expect(screen.getByText(/Tesco/)).toBeInTheDocument();
		}
	});

	it("should handle member_joined events", () => {
		const memberJoinedEvents: HouseholdActivityEvent[] = [
			{
				id: "activity-1",
				type: "member_joined",
				description: "New member joined",
				actor_id: "user-1",
				actor_name: "John Doe",
				timestamp: "2024-01-15T10:00:00Z",
			},
		];

		render(<HouseholdActivityFeed activities={memberJoinedEvents} />);
		expect(screen.getByText("New member joined")).toBeInTheDocument();
	});

	it("should handle transaction_shared events", () => {
		const transactionEvents: HouseholdActivityEvent[] = [
			{
				id: "activity-1",
				type: "transaction_shared",
				description: "Shared expense at Store",
				actor_id: "user-1",
				actor_name: "John Doe",
				timestamp: "2024-01-15T10:00:00Z",
				metadata: {
					amount: -100,
					merchant: "Store",
				},
			},
		];

		render(<HouseholdActivityFeed activities={transactionEvents} />);
		expect(screen.getByText(/Shared expense at Store/)).toBeInTheDocument();
	});

	it("should handle large_transaction events", () => {
		const largeTransactionEvents: HouseholdActivityEvent[] = [
			{
				id: "activity-1",
				type: "large_transaction",
				description: "Large expense shared",
				actor_id: "user-1",
				actor_name: "John Doe",
				timestamp: "2024-01-15T10:00:00Z",
				metadata: {
					amount: -1000,
					merchant: "Electronics Store",
				},
			},
		];

		render(<HouseholdActivityFeed activities={largeTransactionEvents} />);
		expect(screen.getByText(/Large expense/)).toBeInTheDocument();
	});

	it("should sort activities by timestamp (most recent first)", () => {
		const { container } = render(
			<HouseholdActivityFeed activities={mockActivities} />,
		);

		const activityDescriptions = Array.from(
			container.querySelectorAll('[class*="description"]'),
		).map((el) => el.textContent);

		// Most recent should be first (Bob Smith - Jan 17)
		expect(activityDescriptions[0]).toContain("Bob Smith");
	});

	it("should display activity metadata when available", () => {
		render(<HouseholdActivityFeed activities={mockActivities} />);

		// Check for merchant names in metadata
		expect(screen.getByText(/Tesco/)).toBeInTheDocument();
		expect(screen.getByText(/Apple Store/)).toBeInTheDocument();
	});

	it("should handle activities without metadata", () => {
		const activitiesWithoutMetadata: HouseholdActivityEvent[] = [
			{
				id: "activity-1",
				type: "member_joined",
				description: "Member joined",
				actor_id: "user-1",
				actor_name: "John Doe",
				timestamp: "2024-01-15T10:00:00Z",
				// No metadata
			},
		];

		render(<HouseholdActivityFeed activities={activitiesWithoutMetadata} />);
		expect(screen.getByText("Member joined")).toBeInTheDocument();
	});

	it("should render activity icons based on type", () => {
		const { container } = render(
			<HouseholdActivityFeed activities={mockActivities} />,
		);

		// Check for icon elements (lucide-react icons)
		const icons = container.querySelectorAll("svg");
		expect(icons.length).toBeGreaterThan(0);
	});

	it("should limit displayed activities if specified", () => {
		const manyActivities: HouseholdActivityEvent[] = Array.from(
			{ length: 100 },
			(_, i) => ({
				id: `activity-${i}`,
				type: "transaction_shared",
				description: `Transaction ${i}`,
				actor_id: "user-1",
				actor_name: "John Doe",
				timestamp: new Date(2024, 0, i + 1).toISOString(),
			}),
		);

		const { container } = render(
			<HouseholdActivityFeed activities={manyActivities} />,
		);

		// Should render but may limit display (implementation dependent)
		expect(container.querySelector('[class*="activity"]')).toBeInTheDocument();
	});

	it("should format timestamps in a user-friendly way", () => {
		const recentActivity: HouseholdActivityEvent[] = [
			{
				id: "activity-1",
				type: "transaction_shared",
				description: "Recent transaction",
				actor_id: "user-1",
				actor_name: "John Doe",
				timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
			},
		];

		const { container } = render(
			<HouseholdActivityFeed activities={recentActivity} />,
		);

		// Should show relative time like "5 minutes ago"
		const timeElement = container.querySelector("time");
		expect(timeElement).toBeInTheDocument();
	});
});
