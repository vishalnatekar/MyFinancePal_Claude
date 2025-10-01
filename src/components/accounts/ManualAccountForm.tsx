"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ManualAccountInput } from "@/types/account";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircle,
	Building2,
	CreditCard,
	Loader2,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const manualAccountSchema = z.object({
	account_type: z.enum(["checking", "savings", "investment", "credit"], {
		required_error: "Please select an account type",
	}),
	account_name: z
		.string()
		.min(1, "Account name is required")
		.max(100, "Account name must be less than 100 characters"),
	institution_name: z
		.string()
		.min(1, "Institution name is required")
		.max(100, "Institution name must be less than 100 characters"),
	current_balance: z
		.number()
		.min(-999999.99, "Balance must be greater than -£999,999.99")
		.max(999999.99, "Balance must be less than £999,999.99"),
	is_shared: z.boolean().default(false),
});

type FormData = z.infer<typeof manualAccountSchema>;

interface ManualAccountFormProps {
	onSuccess: (account: any) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
}

export function ManualAccountForm({
	onSuccess,
	onCancel,
	isSubmitting: externalSubmitting = false,
}: ManualAccountFormProps) {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(manualAccountSchema),
		defaultValues: {
			account_type: undefined,
			account_name: "",
			institution_name: "",
			current_balance: 0,
			is_shared: false,
		},
	});

	const accountTypeOptions = [
		{
			value: "checking" as const,
			label: "Checking Account",
			description: "Current account for daily transactions",
			icon: CreditCard,
		},
		{
			value: "savings" as const,
			label: "Savings Account",
			description: "Savings account for storing money",
			icon: Wallet,
		},
		{
			value: "investment" as const,
			label: "Investment Account",
			description: "Investment or brokerage account",
			icon: TrendingUp,
		},
		{
			value: "credit" as const,
			label: "Credit Card",
			description: "Credit card account",
			icon: CreditCard,
		},
	];

	const onSubmit = async (data: FormData) => {
		if (isSubmitting || externalSubmitting) return;

		try {
			setIsSubmitting(true);
			setError(null);

			const response = await fetch("/api/accounts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.error || "Failed to create account");
			}

			const result = await response.json();
			onSuccess(result.account);
			form.reset();
		} catch (err) {
			console.error("Error creating manual account:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to create account";
			setError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getAccountTypeIcon = (type: string) => {
		const option = accountTypeOptions.find((opt) => opt.value === type);
		return option ? option.icon : Building2;
	};

	const loading = isSubmitting || externalSubmitting;

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Building2 className="h-5 w-5" />
					Add Manual Account
				</CardTitle>
				<CardDescription>
					Add an account that isn't supported for automatic connection. You can
					update the balance manually as needed.
				</CardDescription>
			</CardHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="account_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Type</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select account type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{accountTypeOptions.map((option) => {
												const Icon = option.icon;
												return (
													<SelectItem key={option.value} value={option.value}>
														<div className="flex items-center gap-2">
															<Icon className="h-4 w-4" />
															<div>
																<div className="font-medium">
																	{option.label}
																</div>
																<div className="text-xs text-muted-foreground">
																	{option.description}
																</div>
															</div>
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="account_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Name</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g. Main Checking, Emergency Fund"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										A descriptive name for this account
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="institution_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Institution Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g. Chase Bank, Vanguard" {...field} />
									</FormControl>
									<FormDescription>
										The bank or financial institution
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="current_balance"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Current Balance (£)</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											placeholder="0.00"
											{...field}
											onChange={(e) =>
												field.onChange(Number.parseFloat(e.target.value) || 0)
											}
										/>
									</FormControl>
									<FormDescription>
										The current balance of this account
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="is_shared"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Shared Account</FormLabel>
										<FormDescription>
											This account is shared with other household members
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</CardContent>

					<CardFooter className="flex justify-between">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Creating...
								</>
							) : (
								"Create Account"
							)}
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
