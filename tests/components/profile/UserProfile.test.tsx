import { UserProfile } from "@/components/profile/UserProfile";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the auth store
const mockUseAuthStore = jest.fn();
jest.mock("@/stores/auth-store", () => ({
	useAuthStore: (...args: unknown[]) => mockUseAuthStore(...args),
}));

describe("UserProfile Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders loading state when user or profile is null", () => {
		mockUseAuthStore.mockReturnValue({
			user: null,
			profile: null,
		});

		render(<UserProfile />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("renders user profile information correctly", () => {
		const mockUser = {
			id: "test-user-id",
			email: "test@example.com",
		};

		const mockProfile = {
			id: "test-user-id",
			email: "test@example.com",
			full_name: "John Doe",
			avatar_url: "https://example.com/avatar.jpg",
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		mockUseAuthStore.mockReturnValue({
			user: mockUser,
			profile: mockProfile,
		} as any);

		render(<UserProfile />);

		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
		expect(screen.getByText("Google Account")).toBeInTheDocument();
	});

	it("displays fallback name when full_name is not provided", () => {
		const mockUser = {
			id: "test-user-id",
			email: "test@example.com",
		};

		const mockProfile = {
			id: "test-user-id",
			email: "test@example.com",
			full_name: null,
			avatar_url: null,
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		mockUseAuthStore.mockReturnValue({
			user: mockUser,
			profile: mockProfile,
		} as any);

		render(<UserProfile />);

		expect(screen.getByText("No name provided")).toBeInTheDocument();
		expect(screen.getByText("Not provided")).toBeInTheDocument();
	});

	it("formats join date correctly", () => {
		const mockUser = {
			id: "test-user-id",
			email: "test@example.com",
		};

		const mockProfile = {
			id: "test-user-id",
			email: "test@example.com",
			full_name: "John Doe",
			avatar_url: null,
			created_at: "2023-06-15T00:00:00Z",
			updated_at: "2023-06-15T00:00:00Z",
		};

		mockUseAuthStore.mockReturnValue({
			user: mockUser,
			profile: mockProfile,
		} as any);

		render(<UserProfile />);

		expect(screen.getByText("June 15, 2023")).toBeInTheDocument();
	});

	it("displays avatar with correct fallback initials", () => {
		const mockUser = {
			id: "test-user-id",
			email: "test@example.com",
		};

		const mockProfile = {
			id: "test-user-id",
			email: "test@example.com",
			full_name: "John Doe",
			avatar_url: null,
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		mockUseAuthStore.mockReturnValue({
			user: mockUser,
			profile: mockProfile,
		} as any);

		render(<UserProfile />);

		expect(screen.getByText("JD")).toBeInTheDocument();
	});
});
