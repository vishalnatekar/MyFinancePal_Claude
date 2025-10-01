"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface EmptyStateProps {
	icon: string;
	title: string;
	description: string;
	actionText: string;
	actionHref: string;
	secondaryActionText?: string;
	secondaryActionHref?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	actionText,
	actionHref,
	secondaryActionText,
	secondaryActionHref,
}: EmptyStateProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
				<div className="text-6xl mb-4">{icon}</div>
				<h3 className="text-lg font-semibold mb-2">{title}</h3>
				<p className="text-muted-foreground mb-6 max-w-md">{description}</p>
				<div className="flex flex-col sm:flex-row gap-2">
					<Button asChild>
						<Link href={actionHref}>{actionText}</Link>
					</Button>
					{secondaryActionText && secondaryActionHref && (
						<Button asChild variant="outline">
							<Link href={secondaryActionHref}>{secondaryActionText}</Link>
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
