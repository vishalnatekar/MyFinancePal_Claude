"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
	const { initializeAuth } = useAuthStore();

	useEffect(() => {
		initializeAuth();
	}, [initializeAuth]);

	return <>{children}</>;
}
