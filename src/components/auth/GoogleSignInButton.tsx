"use client";

import { cn } from "@/lib/utils";
import type React from "react";

interface GoogleSignInButtonProps {
	onClick: () => void;
	variant?: "default" | "outline";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
}

export function GoogleSignInButton({
	onClick,
	variant = "default",
	size = "md",
	isLoading = false,
	disabled = false,
	className,
	children,
}: GoogleSignInButtonProps) {
	const baseClasses =
		"inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

	const variantClasses = {
		default: "bg-primary text-primary-foreground hover:bg-primary/90",
		outline:
			"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
	};

	const sizeClasses = {
		sm: "h-9 px-3 text-sm",
		md: "h-10 px-4 py-2",
		lg: "h-11 px-8 text-lg",
	};

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || isLoading}
			className={cn(
				baseClasses,
				variantClasses[variant],
				sizeClasses[size],
				className,
			)}
		>
			{isLoading ? (
				<>
					<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					Signing in...
				</>
			) : (
				<>
					<svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" role="img">
						<title>Google icon</title>
						<path
							fill="currentColor"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="currentColor"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="currentColor"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="currentColor"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					{children || "Sign in with Google"}
				</>
			)}
		</button>
	);
}
