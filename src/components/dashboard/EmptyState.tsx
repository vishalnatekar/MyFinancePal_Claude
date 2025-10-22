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
		<Card className="bg-background/70">
			<CardContent className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
					{icon}
				</div>
				<div className="space-y-3">
					<h3 className="text-lg font-semibold text-foreground">{title}</h3>
					<p className="mx-auto max-w-md text-sm text-muted-foreground">
						{description}
					</p>
				</div>
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
