import { render, screen } from "@testing-library/react";
import { MemberContributionSummary } from "@/components/household/MemberContributionSummary";
import type { HouseholdMemberWithStats } from "@/types/household";

describe("MemberContributionSummary", () => {
	const mockMembers: HouseholdMemberWithStats[] = [
		{
			id: "member-1",
			user_id: "user-1",
			name: "John Doe",
			email: "john@example.com",
			role: "owner",
			joined_at: "2024-01-01T00:00:00Z",
			shared_accounts_count: 2,
			shared_transactions_count: 10,
			total_contribution: 500,
		},
		{
			id: "member-2",
			user_id: "user-2",
			name: "Jane Doe",
			email: "jane@example.com",
			role: "member",
			joined_at: "2024-01-15T00:00:00Z",
			shared_accounts_count: 1,
			shared_transactions_count: 5,
			total_contribution: 300,
		},
		{
			id: "member-3",
			user_id: "user-3",
			name: "Bob Smith",
			email: "bob@example.com",
			role: "member",
			joined_at: "2024-02-01T00:00:00Z",
			shared_accounts_count: 1,
			shared_transactions_count: 3,
			total_contribution: 200,
		},
	];

	it("should render the card with correct title", () => {
		render(<MemberContributionSummary members={mockMembers} />);
		expect(screen.getByText("Member Contributions")).toBeInTheDocument();
	});

	it("should display all member names", () => {
		render(<MemberContributionSummary members={mockMembers} />);
		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		expect(screen.getByText("Bob Smith")).toBeInTheDocument();
	});

	it("should display member contribution amounts", () => {
		render(<MemberContributionSummary members={mockMembers} />);
		expect(screen.getByText("£500.00")).toBeInTheDocument();
		expect(screen.getByText("£300.00")).toBeInTheDocument();
		expect(screen.getByText("£200.00")).toBeInTheDocument();
	});

	it("should calculate and display correct percentages", () => {
		render(<MemberContributionSummary members={mockMembers} />);
		// Total: 500 + 300 + 200 = 1000
		// John: 500/1000 = 50%
		// Jane: 300/1000 = 30%
		// Bob: 200/1000 = 20%
		expect(screen.getByText("50%")).toBeInTheDocument();
		expect(screen.getByText("30%")).toBeInTheDocument();
		expect(screen.getByText("20%")).toBeInTheDocument();
	});

	it("should handle empty members array", () => {
		render(<MemberContributionSummary members={[]} />);
		expect(screen.getByText("Member Contributions")).toBeInTheDocument();
		expect(
			screen.getByText(/No member contributions yet/i),
		).toBeInTheDocument();
	});

	it("should handle members with zero contributions", () => {
		const membersWithZero: HouseholdMemberWithStats[] = [
			{
				id: "member-1",
				user_id: "user-1",
				name: "John Doe",
				email: "john@example.com",
				role: "owner",
				joined_at: "2024-01-01T00:00:00Z",
				shared_accounts_count: 1,
				shared_transactions_count: 0,
				total_contribution: 0,
			},
		];

		render(<MemberContributionSummary members={membersWithZero} />);
		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("£0.00")).toBeInTheDocument();
	});

	it("should sort members by contribution amount (highest first)", () => {
		const { container } = render(
			<MemberContributionSummary members={mockMembers} />,
		);

		// Get all member names in order
		const memberElements = screen.getAllByText(/Doe|Smith/);

		// First member should be John Doe (highest contribution: £500)
		expect(memberElements[0]).toHaveTextContent("John Doe");
	});

	it("should display transaction counts", () => {
		render(<MemberContributionSummary members={mockMembers} />);
		expect(screen.getByText(/10.*transactions/i)).toBeInTheDocument();
		expect(screen.getByText(/5.*transactions/i)).toBeInTheDocument();
		expect(screen.getByText(/3.*transactions/i)).toBeInTheDocument();
	});

	it("should handle single member", () => {
		const singleMember: HouseholdMemberWithStats[] = [mockMembers[0]];
		render(<MemberContributionSummary members={singleMember} />);

		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("100%")).toBeInTheDocument(); // 100% of total
	});

	it("should display avatars for members with avatar_url", () => {
		const membersWithAvatars: HouseholdMemberWithStats[] = [
			{
				...mockMembers[0],
				avatar_url: "https://example.com/avatar.jpg",
			},
		];

		const { container } = render(
			<MemberContributionSummary members={membersWithAvatars} />,
		);

		// Avatar component should be rendered
		const avatar = container.querySelector('[class*="avatar"]');
		expect(avatar).toBeInTheDocument();
	});

	it("should show progress bars for contributions", () => {
		const { container } = render(
			<MemberContributionSummary members={mockMembers} />,
		);

		// Check for progress bar elements
		const progressBars = container.querySelectorAll('[role="progressbar"]');
		expect(progressBars.length).toBeGreaterThan(0);
	});
});
