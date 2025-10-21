"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NotificationWithActor } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";
import { Check, DollarSign, UserCheck, UserMinus } from "lucide-react";

interface NotificationItemProps {
	notification: NotificationWithActor;
	onMarkAsRead?: (notificationId: string) => void;
	onClick?: (notification: NotificationWithActor) => void;
}

const notificationIcons = {
	transaction_shared: DollarSign,
	large_transaction: DollarSign,
	member_joined: UserCheck,
	member_left: UserMinus,
};

const notificationColors = {
	transaction_shared: "text-blue-500",
	large_transaction: "text-orange-500",
	member_joined: "text-green-500",
	member_left: "text-gray-500",
};

export function NotificationItem({
	notification,
	onMarkAsRead,
	onClick,
}: NotificationItemProps) {
	const Icon = notificationIcons[notification.type];
	const iconColor = notificationColors[notification.type];

	const handleClick = () => {
		if (onClick) {
			onClick(notification);
		}
	};

	const handleMarkAsRead = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMarkAsRead && !notification.is_read) {
			onMarkAsRead(notification.id);
		}
	};

	const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
		addSuffix: true,
	});

	return (
		<button
			type="button"
			className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left hover:bg-muted/50 ${
				notification.is_read ? "opacity-60" : "bg-muted/30"
			}`}
			onClick={handleClick}
		>
			<div className={`mt-1 ${iconColor}`}>
				<Icon className="w-5 h-5" />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium leading-tight">
							{notification.title}
						</p>
						<p className="text-sm text-muted-foreground leading-tight mt-1">
							{notification.message}
						</p>
					</div>

					{!notification.is_read && onMarkAsRead && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 shrink-0"
							onClick={handleMarkAsRead}
							title="Mark as read"
						>
							<Check className="w-4 h-4" />
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2 mt-2">
					<span className="text-xs text-muted-foreground">{timeAgo}</span>
					{!notification.is_read && (
						<Badge variant="secondary" className="text-xs">
							New
						</Badge>
					)}
				</div>
			</div>
		</button>
	);
}
