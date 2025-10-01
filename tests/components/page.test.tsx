import HomePage from "@/app/page";
import { render, screen } from "@testing-library/react";

// Mock the auth functions
jest.mock("@/lib/auth", () => ({
	signInWithGoogle: jest.fn(),
}));

describe("HomePage", () => {
	it("renders welcome message", () => {
		render(<HomePage />);

		expect(screen.getByText("Welcome to MyFinancePal")).toBeInTheDocument();
		expect(
			screen.getByText("Your household financial management solution"),
		).toBeInTheDocument();
	});

	it("renders sign in button when user is not authenticated", () => {
		render(<HomePage />);

		expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
	});
});
