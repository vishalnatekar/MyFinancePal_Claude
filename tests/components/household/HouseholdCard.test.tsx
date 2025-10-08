import { HouseholdCard } from "@/components/household/HouseholdCard";
import type { HouseholdWithMembers } from "@/types/household";
import { render, screen } from "@testing-library/react";

const mockHousehold: HouseholdWithMembers = {
	id: "test-id",
	name: "Test Household",
	description: "A test household",
	created_by: "user-id",
	settlement_day: 15,
	created_at: "2025-01-01T00:00:00Z",
	updated_at: "2025-01-01T00:00:00Z",
	household_members: [
		{
			id: "member-1",
			household_id: "test-id",
			user_id: "user-1",
			role: "creator",
			joined_at: "2025-01-01T00:00:00Z",
			profiles: {
				email: "test@example.com",
				full_name: "Test User",
				avatar_url: null,
			},
		},
		{
			id: "member-2",
			household_id: "test-id",
			user_id: "user-2",
			role: "member",
			joined_at: "2025-01-02T00:00:00Z",
			profiles: {
				email: "test2@example.com",
				full_name: "Test User 2",
				avatar_url: null,
			},
		},
	],
};

describe("HouseholdCard", () => {
	it("renders household name and description", () => {
		render(<HouseholdCard household={mockHousehold} />);

		expect(screen.getByText("Test Household")).toBeInTheDocument();
		expect(screen.getByText("A test household")).toBeInTheDocument();
	});

	it("displays member count correctly", () => {
		render(<HouseholdCard household={mockHousehold} />);

		expect(screen.getByText("2 members")).toBeInTheDocument();
	});

	it("displays settlement day", () => {
		render(<HouseholdCard household={mockHousehold} />);

		expect(screen.getByText("Settlement day: 15")).toBeInTheDocument();
	});

	it("shows creator badge when user is creator", () => {
		render(<HouseholdCard household={mockHousehold} userRole="creator" />);

		expect(screen.getByText("Creator")).toBeInTheDocument();
	});

	it("shows member badge when user is member", () => {
		render(<HouseholdCard household={mockHousehold} userRole="member" />);

		expect(screen.getByText("Member")).toBeInTheDocument();
	});

	it("renders View Household button with correct link", () => {
		render(<HouseholdCard household={mockHousehold} />);

		const button = screen.getByText("View Household");
		expect(button).toBeInTheDocument();
		expect(button.closest("a")).toHaveAttribute("href", "/household/test-id");
	});

	it("handles single member correctly", () => {
		const singleMemberHousehold = {
			...mockHousehold,
			household_members: [mockHousehold.household_members[0]],
		};

		render(<HouseholdCard household={singleMemberHousehold} />);

		expect(screen.getByText("1 member")).toBeInTheDocument();
	});
});
