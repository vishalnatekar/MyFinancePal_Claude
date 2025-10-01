"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	text?: string;
	className?: string;
	fullScreen?: boolean;
}

const sizeClasses = {
	sm: "w-4 h-4",
	md: "w-6 h-6",
	lg: "w-8 h-8",
};

export function LoadingSpinner({
	size = "md",
	text,
	className,
	fullScreen = false,
}: LoadingSpinnerProps) {
	const content = (
		<div className={cn("flex flex-col items-center space-y-2", className)}>
			<Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
			{text && (
				<p className="text-sm text-muted-foreground text-center">{text}</p>
			)}
		</div>
	);

	if (fullScreen) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				{content}
			</div>
		);
	}

	return content;
}
