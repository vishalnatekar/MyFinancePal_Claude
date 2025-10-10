"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter } from "lucide-react";

export type SharingStatus = "all" | "shared" | "private";

interface SharingStatusFilterProps {
	currentStatus: SharingStatus;
	onStatusChange: (status: SharingStatus) => void;
	sharedCount?: number;
	privateCount?: number;
}

export function SharingStatusFilter({
	currentStatus,
	onStatusChange,
	sharedCount,
	privateCount,
}: SharingStatusFilterProps) {
	const getLabel = (status: SharingStatus) => {
		switch (status) {
			case "all":
				return "All Transactions";
			case "shared":
				return `Shared${sharedCount !== undefined ? ` (${sharedCount})` : ""}`;
			case "private":
				return `Private${privateCount !== undefined ? ` (${privateCount})` : ""}`;
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					<Filter className="h-4 w-4 mr-2" />
					{getLabel(currentStatus)}
					<ChevronDown className="h-4 w-4 ml-2" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup
					value={currentStatus}
					onValueChange={(value) => onStatusChange(value as SharingStatus)}
				>
					<DropdownMenuRadioItem value="all">
						All Transactions
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="shared">
						Shared Only
						{sharedCount !== undefined && ` (${sharedCount})`}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="private">
						Private Only
						{privateCount !== undefined && ` (${privateCount})`}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
