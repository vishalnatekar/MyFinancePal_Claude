import { AuthenticationStatus } from "@/components/auth/AuthenticationStatus";
import { useAuth } from "@/hooks/use-auth";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock the useAuth hook
jest.mock("@/hooks/use-auth");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUser = {
	id: "test-user-id",
	email: "test@example.com",
	user_metadata: {},
	app_metadata: {},
	aud: "authenticated",
	created_at: "2023-01-01T00:00:00.000Z",
};

const mockProfile = {
	id: "test-user-id",
	email: "test@example.com",
	full_name: "Test User",
	avatar_url: "https://example.com/avatar.jpg",
	created_at: "2023-01-01T00:00:00.000Z",
	updated_at: "2023-01-01T00:00:00.000Z",
};

describe("AuthenticationStatus", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("shows loading state", () => {
		mockUseAuth.mockReturnValue({
			user: null,
			profile: null,
			loading: true,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: jest.fn(),
			refreshProfile: jest.fn(),
			isAuthenticated: false,
		});

		render(<AuthenticationStatus />);

		// Check for loading skeleton
		expect(screen.getByRole("img")).toHaveClass("animate-pulse");
	});

	it("shows not signed in message when user is null", () => {
		mockUseAuth.mockReturnValue({
			user: null,
			profile: null,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: jest.fn(),
			refreshProfile: jest.fn(),
			isAuthenticated: false,
		});

		render(<AuthenticationStatus />);

		expect(screen.getByText("Not signed in")).toBeInTheDocument();
	});

	it("displays user information when authenticated", () => {
		const mockSignOut = jest.fn();
		mockUseAuth.mockReturnValue({
			user: mockUser as any,
			profile: mockProfile,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: mockSignOut,
			refreshProfile: jest.fn(),
			isAuthenticated: true,
		});

		render(<AuthenticationStatus showName={true} showEmail={true} />);

		expect(screen.getByText("Test User")).toBeInTheDocument();
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("displays avatar when available", () => {
		mockUseAuth.mockReturnValue({
			user: mockUser as any,
			profile: mockProfile,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: jest.fn(),
			refreshProfile: jest.fn(),
			isAuthenticated: true,
		});

		render(<AuthenticationStatus showAvatar={true} />);

		const avatarImg = screen.getByRole("img");
		expect(avatarImg).toHaveAttribute("src", mockProfile.avatar_url);
		expect(avatarImg).toHaveAttribute("alt", "Test User");
	});

	it("displays fallback avatar when avatar_url is not available", () => {
		const profileWithoutAvatar = { ...mockProfile, avatar_url: null };
		mockUseAuth.mockReturnValue({
			user: mockUser as any,
			profile: profileWithoutAvatar,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: jest.fn(),
			refreshProfile: jest.fn(),
			isAuthenticated: true,
		});

		render(<AuthenticationStatus showAvatar={true} />);

		// Should show first letter of name as fallback
		expect(screen.getByText("T")).toBeInTheDocument();
	});

	it("calls signOut when sign out button is clicked", async () => {
		const mockSignOut = jest.fn();
		mockUseAuth.mockReturnValue({
			user: mockUser as any,
			profile: mockProfile,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: mockSignOut,
			refreshProfile: jest.fn(),
			isAuthenticated: true,
		});

		render(<AuthenticationStatus />);

		const signOutButton = screen.getByText("Sign out");
		fireEvent.click(signOutButton);

		await waitFor(() => {
			expect(mockSignOut).toHaveBeenCalledTimes(1);
		});
	});

	it("calls custom onSignOut when provided", async () => {
		const mockSignOut = jest.fn();
		const mockCustomSignOut = jest.fn();
		mockUseAuth.mockReturnValue({
			user: mockUser as any,
			profile: mockProfile,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: mockSignOut,
			refreshProfile: jest.fn(),
			isAuthenticated: true,
		});

		render(<AuthenticationStatus onSignOut={mockCustomSignOut} />);

		const signOutButton = screen.getByText("Sign out");
		fireEvent.click(signOutButton);

		await waitFor(() => {
			expect(mockCustomSignOut).toHaveBeenCalledTimes(1);
			expect(mockSignOut).not.toHaveBeenCalled();
		});
	});

	it("hides elements based on props", () => {
		mockUseAuth.mockReturnValue({
			user: mockUser as any,
			profile: mockProfile,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: jest.fn(),
			refreshProfile: jest.fn(),
			isAuthenticated: true,
		});

		render(
			<AuthenticationStatus
				showAvatar={false}
				showName={false}
				showEmail={false}
			/>,
		);

		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(screen.queryByText("Test User")).not.toBeInTheDocument();
		expect(screen.queryByText("test@example.com")).not.toBeInTheDocument();
	});

	it("shows online indicator", () => {
		mockUseAuth.mockReturnValue({
			user: mockUser as any,
			profile: mockProfile,
			loading: false,
			error: null,
			signInWithGoogle: jest.fn(),
			signOut: jest.fn(),
			refreshProfile: jest.fn(),
			isAuthenticated: true,
		});

		render(<AuthenticationStatus showAvatar={true} />);

		// Check for online indicator (green dot)
		const onlineIndicator = document.querySelector(".bg-green-500");
		expect(onlineIndicator).toBeInTheDocument();
	});
});
