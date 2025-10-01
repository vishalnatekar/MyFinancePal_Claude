import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

describe("GoogleSignInButton", () => {
	it("renders with default props", () => {
		const mockOnClick = jest.fn();
		render(<GoogleSignInButton onClick={mockOnClick} />);

		const button = screen.getByRole("button", { name: /sign in with google/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("bg-primary");
	});

	it("renders with custom text", () => {
		const mockOnClick = jest.fn();
		render(
			<GoogleSignInButton onClick={mockOnClick}>
				Custom Sign In Text
			</GoogleSignInButton>,
		);

		expect(screen.getByText("Custom Sign In Text")).toBeInTheDocument();
	});

	it("calls onClick when clicked", () => {
		const mockOnClick = jest.fn();
		render(<GoogleSignInButton onClick={mockOnClick} />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(mockOnClick).toHaveBeenCalledTimes(1);
	});

	it("shows loading state", () => {
		const mockOnClick = jest.fn();
		render(<GoogleSignInButton onClick={mockOnClick} isLoading={true} />);

		expect(screen.getByText("Signing in...")).toBeInTheDocument();
		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});

	it("can be disabled", () => {
		const mockOnClick = jest.fn();
		render(<GoogleSignInButton onClick={mockOnClick} disabled={true} />);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();

		fireEvent.click(button);
		expect(mockOnClick).not.toHaveBeenCalled();
	});

	it("renders with outline variant", () => {
		const mockOnClick = jest.fn();
		render(<GoogleSignInButton onClick={mockOnClick} variant="outline" />);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("border");
		expect(button).not.toHaveClass("bg-primary");
	});

	it("renders with different sizes", () => {
		const mockOnClick = jest.fn();
		const { rerender } = render(
			<GoogleSignInButton onClick={mockOnClick} size="sm" />,
		);

		let button = screen.getByRole("button");
		expect(button).toHaveClass("h-9");

		rerender(<GoogleSignInButton onClick={mockOnClick} size="lg" />);
		button = screen.getByRole("button");
		expect(button).toHaveClass("h-11");
	});

	it("applies custom className", () => {
		const mockOnClick = jest.fn();
		render(
			<GoogleSignInButton onClick={mockOnClick} className="custom-class" />,
		);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
	});

	it("displays Google icon", () => {
		const mockOnClick = jest.fn();
		render(<GoogleSignInButton onClick={mockOnClick} />);

		// Check for SVG element (Google icon)
		const googleIcon = screen.getByRole("button").querySelector("svg");
		expect(googleIcon).toBeInTheDocument();
	});

	it("does not call onClick when loading", () => {
		const mockOnClick = jest.fn();
		render(<GoogleSignInButton onClick={mockOnClick} isLoading={true} />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(mockOnClick).not.toHaveBeenCalled();
	});
});
