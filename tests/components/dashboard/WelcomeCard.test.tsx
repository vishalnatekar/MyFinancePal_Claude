import { render, screen } from "@testing-library/react";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { useAuthStore } from "@/stores/auth-store";
import "@testing-library/jest-dom";

// Mock Next.js Link component
jest.mock("next/link", () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	);
});

// Mock the auth store
jest.mock("@/stores/auth-store");
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe("WelcomeCard Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Mock Date to ensure consistent time-based greetings in tests
		jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14); // 2 PM
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders loading state when user or profile is null", () => {
		mockUseAuthStore.mockReturnValue({
			user: null,
			profile: null,
		} as any);

		render(<WelcomeCard />);

		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("renders welcome message with user name", () => {
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

		render(<WelcomeCard />);

		expect(screen.getByText("Good afternoon, John!")).toBeInTheDocument();
		expect(screen.getByText("Welcome back to MyFinancePal")).toBeInTheDocument();
	});

	it("uses fallback name when full_name is not provided", () => {
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

		render(<WelcomeCard />);

		expect(screen.getByText("Good afternoon, there!")).toBeInTheDocument();
	});

	it("displays correct greeting based on time of day", () => {
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

		// Test afternoon greeting (already mocked to 2 PM)
		render(<WelcomeCard />);
		expect(screen.getByText("Good afternoon, John!")).toBeInTheDocument();

		// Test morning greeting
		jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9); // 9 AM
		const { rerender } = render(<WelcomeCard />);
		expect(screen.getByText("Good morning, John!")).toBeInTheDocument();
	});

	it("renders quick action buttons", () => {
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

		render(<WelcomeCard />);

		expect(screen.getByText("Add Bank Account")).toBeInTheDocument();
		expect(screen.getByText("Create Household")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();

		// Check that links have correct hrefs
		expect(screen.getByRole("link", { name: /Add Bank Account/ })).toHaveAttribute("href", "/accounts/connect");
		expect(screen.getByRole("link", { name: /Create Household/ })).toHaveAttribute("href", "/household/create");
		expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/profile");
	});

	it("displays avatar with correct fallback", () => {
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

		render(<WelcomeCard />);

		expect(screen.getByText("JD")).toBeInTheDocument(); // Initials fallback
	});
});