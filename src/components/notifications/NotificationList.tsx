"use client";

import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { NotificationWithActor } from "@/types/notification";
import { CheckCheck, Inbox } from "lucide-react";

interface NotificationListProps {
	notifications: NotificationWithActor[];
	loading?: boolean;
	onMarkAsRead?: (notificationId: string) => void;
	onMarkAllAsRead?: () => void;
	onNotificationClick?: (notification: NotificationWithActor) => void;
	maxHeight?: string;
}

export function NotificationList({
	notifications,
	loading = false,
	onMarkAsRead,
	onMarkAllAsRead,
	onNotificationClick,
	maxHeight = "400px",
}: NotificationListProps) {
	const hasUnread = notifications.some((n) => !n.is_read);

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (notifications.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-8 text-center">
				<Inbox className="w-12 h-12 text-muted-foreground mb-3" />
				<p className="text-sm font-medium text-muted-foreground">
					No notifications
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					You're all caught up!
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{hasUnread && onMarkAllAsRead && (
				<>
					<div className="flex items-center justify-between p-3">
						<span className="text-sm font-medium">Notifications</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={onMarkAllAsRead}
							className="text-xs h-8"
						>
							<CheckCheck className="w-4 h-4 mr-1" />
							Mark all read
						</Button>
					</div>
					<Separator />
				</>
			)}

			<div className="overflow-y-auto" style={{ maxHeight }}>
				<div className="flex flex-col">
					{notifications.map((notification, index) => (
						<div key={notification.id}>
							<NotificationItem
								notification={notification}
								onMarkAsRead={onMarkAsRead}
								onClick={onNotificationClick}
							/>
							{index < notifications.length - 1 && <Separator />}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
