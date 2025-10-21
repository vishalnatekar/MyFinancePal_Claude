import { UserPreferences } from "@/components/profile/UserPreferences";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the user preferences hook
jest.mock("@/hooks/use-user-preferences");
const mockUseUserPreferences = useUserPreferences as jest.MockedFunction<
	typeof useUserPreferences
>;

describe("UserPreferences Component", () => {
	const mockUpdatePreferences = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockUpdatePreferences.mockClear();
	});

	it("renders loading state", () => {
		mockUseUserPreferences.mockReturnValue({
			preferences: null,
			loading: true,
			error: null,
			updatePreferences: mockUpdatePreferences,
			isUpdating: false,
			refetch: jest.fn(),
		});

		render(<UserPreferences />);

		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("renders error state", () => {
		mockUseUserPreferences.mockReturnValue({
			preferences: null,
			loading: false,
			error: "Failed to load preferences",
			updatePreferences: mockUpdatePreferences,
			isUpdating: false,
			refetch: jest.fn(),
		});

		render(<UserPreferences />);

		expect(screen.getByText("Failed to load preferences")).toBeInTheDocument();
	});

	it("renders preferences form with default values", () => {
		const mockPreferences = {
			email_notifications: true,
			shared_expense_alerts: true,
			settlement_reminders: false,
			timezone: "America/New_York",
		};

		mockUseUserPreferences.mockReturnValue({
			preferences: mockPreferences,
			loading: false,
			error: null,
			updatePreferences: mockUpdatePreferences,
			isUpdating: false,
			refetch: jest.fn(),
		});

		render(<UserPreferences />);

		expect(screen.getByLabelText("Email Notifications")).toBeChecked();
		expect(screen.getByLabelText("Shared Expense Alerts")).toBeChecked();
		expect(screen.getByLabelText("Settlement Reminders")).not.toBeChecked();
		expect(screen.getByText("Eastern Time (ET)")).toBeInTheDocument();
	});

	it("disables dependent settings when email notifications are off", async () => {
		const user = userEvent.setup();
		const mockPreferences = {
			email_notifications: false,
			shared_expense_alerts: true,
			settlement_reminders: true,
			timezone: "America/New_York",
		};

		mockUseUserPreferences.mockReturnValue({
			preferences: mockPreferences,
			loading: false,
			error: null,
			updatePreferences: mockUpdatePreferences,
			isUpdating: false,
			refetch: jest.fn(),
		});

		render(<UserPreferences />);

		expect(screen.getByLabelText("Email Notifications")).not.toBeChecked();
		expect(screen.getByLabelText("Shared Expense Alerts")).toBeDisabled();
		expect(screen.getByLabelText("Settlement Reminders")).toBeDisabled();
	});

	it("shows save button when preferences change", async () => {
		const user = userEvent.setup();
		const mockPreferences = {
			email_notifications: true,
			shared_expense_alerts: true,
			settlement_reminders: true,
			timezone: "America/New_York",
		};

		mockUseUserPreferences.mockReturnValue({
			preferences: mockPreferences,
			loading: false,
			error: null,
			updatePreferences: mockUpdatePreferences,
			isUpdating: false,
			refetch: jest.fn(),
		});

		render(<UserPreferences />);

		const emailToggle = screen.getByLabelText("Email Notifications");
		await user.click(emailToggle);

		expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
	});

	it("calls updatePreferences when save button is clicked", async () => {
		const user = userEvent.setup();
		const mockPreferences = {
			email_notifications: true,
			shared_expense_alerts: true,
			settlement_reminders: true,
			timezone: "America/New_York",
		};

		mockUpdatePreferences.mockResolvedValue(undefined);

		mockUseUserPreferences.mockReturnValue({
			preferences: mockPreferences,
			loading: false,
			error: null,
			updatePreferences: mockUpdatePreferences,
			isUpdating: false,
			refetch: jest.fn(),
		});

		render(<UserPreferences />);

		const emailToggle = screen.getByLabelText("Email Notifications");
		await user.click(emailToggle);

		const saveButton = screen.getByRole("button", { name: "Save Changes" });
		await user.click(saveButton);

		expect(mockUpdatePreferences).toHaveBeenCalledWith({
			email_notifications: false,
			shared_expense_alerts: true,
			settlement_reminders: true,
			timezone: "America/New_York",
		});
	});

	it("displays current time in selected timezone", () => {
		const mockPreferences = {
			email_notifications: true,
			shared_expense_alerts: true,
			settlement_reminders: true,
			timezone: "America/Los_Angeles",
		};

		mockUseUserPreferences.mockReturnValue({
			preferences: mockPreferences,
			loading: false,
			error: null,
			updatePreferences: mockUpdatePreferences,
			isUpdating: false,
			refetch: jest.fn(),
		});

		render(<UserPreferences />);

		expect(screen.getByText(/Current time:/)).toBeInTheDocument();
	});
});
