"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AuthErrorProps {
	error: string;
	onRetry?: () => void;
	onClear?: () => void;
	className?: string;
}

export function AuthError({
	error,
	onRetry,
	onClear,
	className,
}: AuthErrorProps) {
	return (
		<div
			className={cn(
				"rounded-md border border-destructive/20 bg-destructive/10 p-4",
				className,
			)}
		>
			<div className="flex items-start space-x-3">
				<div className="flex-shrink-0">
					<svg
						className="h-5 w-5 text-destructive"
						viewBox="0 0 20 20"
						fill="currentColor"
						role="img"
					>
						<title>Error icon</title>
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
							clipRule="evenodd"
						/>
					</svg>
				</div>

				<div className="flex-1">
					<h3 className="text-sm font-medium text-destructive">
						Authentication Error
					</h3>
					<p className="mt-1 text-sm text-destructive/80">{error}</p>

					{(onRetry || onClear) && (
						<div className="mt-3 flex space-x-2">
							{onRetry && (
								<button
									type="button"
									onClick={onRetry}
									className="rounded-md bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/30 transition-colors"
								>
									Try Again
								</button>
							)}
							{onClear && (
								<button
									type="button"
									onClick={onClear}
									className="rounded-md bg-transparent px-3 py-1.5 text-xs font-medium text-destructive/60 hover:text-destructive transition-colors"
								>
									Dismiss
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

interface AuthErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface AuthErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class AuthErrorBoundary extends React.Component<
	AuthErrorBoundaryProps,
	AuthErrorBoundaryState
> {
	constructor(props: AuthErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error(
			"Authentication error boundary caught an error:",
			error,
			errorInfo,
		);
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			const FallbackComponent = this.props.fallback;

			if (FallbackComponent) {
				return (
					<FallbackComponent
						error={this.state.error}
						resetError={this.resetError}
					/>
				);
			}

			return (
				<AuthError
					error={this.state.error.message}
					onRetry={this.resetError}
					className="m-4"
				/>
			);
		}

		return this.props.children;
	}
}
