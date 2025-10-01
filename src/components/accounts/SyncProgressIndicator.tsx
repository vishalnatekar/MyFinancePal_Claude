"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SyncProgressIndicatorProps {
	accountId?: string;
	isVisible: boolean;
	onComplete?: () => void;
}

export function SyncProgressIndicator({
	accountId,
	isVisible,
	onComplete,
}: SyncProgressIndicatorProps) {
	const [progress, setProgress] = useState(0);
	const [status, setStatus] = useState<
		"idle" | "syncing" | "success" | "error"
	>("idle");
	const [message, setMessage] = useState("");
	const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

	// Simulate sync progress (in a real app, this would connect to actual sync status)
	useEffect(() => {
		if (!isVisible || status === "success" || status === "error") return;

		setStatus("syncing");
		setMessage("Connecting to MoneyHub...");
		setProgress(10);

		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 90) {
					clearInterval(interval);
					// Simulate completion
					setTimeout(() => {
						setStatus("success");
						setMessage("Sync completed successfully");
						setProgress(100);
						setLastSyncTime(new Date().toLocaleTimeString());
						onComplete?.();
					}, 500);
					return prev;
				}
				return prev + 10;
			});

			// Update messages based on progress
			setMessage((prev) => {
				if (progress < 30) return "Connecting to MoneyHub...";
				if (progress < 60) return "Fetching account data...";
				if (progress < 90) return "Updating balances...";
				return "Finalizing sync...";
			});
		}, 300);

		return () => clearInterval(interval);
	}, [isVisible, status, onComplete, progress]);

	const getStatusIcon = () => {
		switch (status) {
			case "syncing":
				return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
			case "success":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "error":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			default:
				return <Clock className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = () => {
		switch (status) {
			case "syncing":
				return "bg-blue-500";
			case "success":
				return "bg-green-500";
			case "error":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	if (!isVisible) return null;

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					{getStatusIcon()}
					Account Sync
					{accountId && (
						<Badge variant="outline" className="text-xs">
							{accountId.slice(-8)}
						</Badge>
					)}
				</CardTitle>
				<CardDescription>{message}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Progress</span>
						<span>{progress}%</span>
					</div>
					<Progress value={progress} className="w-full" />
				</div>

				{lastSyncTime && status === "success" && (
					<div className="text-xs text-muted-foreground text-center">
						Last synced at {lastSyncTime}
					</div>
				)}

				{status === "error" && (
					<div className="flex items-center justify-between">
						<span className="text-sm text-red-600">Sync failed</span>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								setStatus("idle");
								setProgress(0);
								setMessage("");
							}}
						>
							<RefreshCw className="h-4 w-4 mr-1" />
							Retry
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
