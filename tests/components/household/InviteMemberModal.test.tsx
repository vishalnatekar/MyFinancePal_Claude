import { InviteMemberModal } from "@/components/household/InviteMemberModal";
import { HouseholdService } from "@/services/household-service";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Mock the HouseholdService
jest.mock("@/services/household-service");

describe("InviteMemberModal", () => {
	const mockOnInviteSent = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders invite button", () => {
		render(
			<InviteMemberModal
				householdId="test-id"
				householdName="Test Household"
				onInviteSent={mockOnInviteSent}
			/>,
		);

		expect(screen.getByText("Invite Member")).toBeInTheDocument();
	});

	it("opens modal when button is clicked", async () => {
		render(
			<InviteMemberModal
				householdId="test-id"
				householdName="Test Household"
				onInviteSent={mockOnInviteSent}
			/>,
		);

		const button = screen.getByText("Invite Member");
		fireEvent.click(button);

		await waitFor(() => {
			expect(
				screen.getByText("Invite Member to Household"),
			).toBeInTheDocument();
		});
	});

	it("displays household name in modal", async () => {
		render(
			<InviteMemberModal
				householdId="test-id"
				householdName="My Test Household"
				onInviteSent={mockOnInviteSent}
			/>,
		);

		fireEvent.click(screen.getByText("Invite Member"));

		await waitFor(() => {
			expect(screen.getByText(/My Test Household/)).toBeInTheDocument();
		});
	});

	it("validates email input", async () => {
		render(
			<InviteMemberModal
				householdId="test-id"
				householdName="Test Household"
				onInviteSent={mockOnInviteSent}
			/>,
		);

		fireEvent.click(screen.getByText("Invite Member"));

		await waitFor(() => {
			const sendButton = screen.getByRole("button", {
				name: /Send Invitation/i,
			});
			fireEvent.click(sendButton);
		});

		await waitFor(() => {
			expect(screen.getByText("Email address is required")).toBeInTheDocument();
		});
	});

	it("sends invitation with valid email", async () => {
		(HouseholdService.sendInvitation as jest.Mock).mockResolvedValue({
			invitation: {
				id: "inv-id",
				email: "test@example.com",
				token: "test-token",
			},
		});

		render(
			<InviteMemberModal
				householdId="test-id"
				householdName="Test Household"
				onInviteSent={mockOnInviteSent}
			/>,
		);

		fireEvent.click(screen.getByText("Invite Member"));

		await waitFor(() => {
			const emailInput = screen.getByPlaceholderText("colleague@example.com");
			fireEvent.change(emailInput, { target: { value: "test@example.com" } });
		});

		const sendButton = screen.getByRole("button", {
			name: /Send Invitation/i,
		});
		fireEvent.click(sendButton);

		await waitFor(() => {
			expect(HouseholdService.sendInvitation).toHaveBeenCalledWith(
				"test-id",
				"test@example.com",
			);
		});

		await waitFor(
			() => {
				expect(
					screen.getByText(/Invitation sent successfully/i),
				).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});

	it("displays error message on failed invitation", async () => {
		(HouseholdService.sendInvitation as jest.Mock).mockRejectedValue(
			new Error("Failed to send invitation"),
		);

		render(
			<InviteMemberModal
				householdId="test-id"
				householdName="Test Household"
				onInviteSent={mockOnInviteSent}
			/>,
		);

		fireEvent.click(screen.getByText("Invite Member"));

		await waitFor(() => {
			const emailInput = screen.getByPlaceholderText("colleague@example.com");
			fireEvent.change(emailInput, { target: { value: "test@example.com" } });
		});

		const sendButton = screen.getByRole("button", {
			name: /Send Invitation/i,
		});
		fireEvent.click(sendButton);

		await waitFor(() => {
			expect(screen.getByText("Failed to send invitation")).toBeInTheDocument();
		});
	});
});
