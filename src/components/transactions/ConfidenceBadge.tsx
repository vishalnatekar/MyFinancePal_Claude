"use client";

import { Badge } from "@/components/ui/badge";
import { getConfidenceLevel } from "@/services/auto-categorization-service";
import type { ConfidenceLevel } from "@/types/transaction";
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	XCircle,
} from "lucide-react";

interface ConfidenceBadgeProps {
	confidenceScore?: number | null;
	showText?: boolean;
	size?: "sm" | "md" | "lg";
}

export function ConfidenceBadge({
	confidenceScore,
	showText = true,
	size = "md",
}: ConfidenceBadgeProps) {
	const level = getConfidenceLevel(confidenceScore);

	const config = {
		high: {
			label: "Automatically categorized",
			icon: CheckCircle2,
			className: "bg-green-100 text-green-800 border-green-200",
		},
		medium: {
			label: "Categorized by rule",
			icon: AlertTriangle,
			className: "bg-yellow-100 text-yellow-800 border-yellow-200",
		},
		low: {
			label: "Needs review",
			icon: AlertCircle,
			className: "bg-orange-100 text-orange-800 border-orange-200",
		},
		none: {
			label: "Uncategorized",
			icon: XCircle,
			className: "bg-red-100 text-red-800 border-red-200",
		},
	};

	const { label, icon: Icon, className } = config[level];

	const iconSize = {
		sm: 12,
		md: 14,
		lg: 16,
	}[size];

	return (
		<Badge variant="outline" className={className}>
			<Icon className="mr-1" size={iconSize} />
			{showText && <span>{label}</span>}
			{confidenceScore !== null &&
				confidenceScore !== undefined &&
				showText && <span className="ml-1">({confidenceScore}%)</span>}
		</Badge>
	);
}
