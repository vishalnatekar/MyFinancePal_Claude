"use client";

import { NotificationList } from "@/components/notifications/NotificationList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationWithActor } from "@/types/notification";
import { Bell } from "lucide-react";
import { useState } from "react";

interface NotificationCenterProps {
	userId?: string;
	householdId?: string;
}

export function NotificationCenter({
	userId,
	householdId,
}: NotificationCenterProps) {
	const [open, setOpen] = useState(false);

	const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
		useNotifications(userId, householdId);

	const handleNotificationClick = async (
		notification: NotificationWithActor,
	) => {
		// Mark as read if unread
		if (!notification.is_read) {
			try {
				await markAsRead(notification.id);
			} catch (error) {
				console.error("Failed to mark notification as read:", error);
			}
		}

		// You can add navigation logic here based on notification type
		// For example, navigate to transaction detail if type is transaction_shared
		if (
			notification.type === "transaction_shared" &&
			notification.metadata?.transaction_id
		) {
			// Could navigate to transaction detail page
			// router.push(`/transactions/${notification.metadata.transaction_id}`);
		}

		// Close the dropdown
		setOpen(false);
	};

	const handleMarkAllAsRead = async () => {
		try {
			await markAllAsRead(householdId);
		} catch (error) {
			console.error("Failed to mark all notifications as read:", error);
		}
	};

	if (!userId) {
		return null;
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="relative w-9 h-9 rounded-full"
				>
					<Bell className="w-5 h-5" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-96 p-0" align="end" forceMount>
				<NotificationList
					notifications={notifications}
					loading={loading}
					onMarkAsRead={markAsRead}
					onMarkAllAsRead={handleMarkAllAsRead}
					onNotificationClick={handleNotificationClick}
					maxHeight="500px"
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
