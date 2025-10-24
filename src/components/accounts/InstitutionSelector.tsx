"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrueLayerProvider } from "@/types/truelayer";
import { AlertCircle, Building, CreditCard, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const LOADING_SKELETON_KEYS = [
	"provider-skeleton-1",
	"provider-skeleton-2",
	"provider-skeleton-3",
	"provider-skeleton-4",
	"provider-skeleton-5",
	"provider-skeleton-6",
];

const ACCOUNT_SCOPE_KEYS = new Set(["accounts", "balance", "transactions"]);

const CARD_SCOPE_PREFIX = "cards";

function supportsAccounts(provider: TrueLayerProvider): boolean {
	const scopes = provider.scopes || [];
	return (
		scopes.some((scope) => ACCOUNT_SCOPE_KEYS.has(scope)) ||
		provider.capabilities?.accounts === true
	);
}

function supportsCards(provider: TrueLayerProvider): boolean {
	const scopes = provider.scopes || [];
	return (
		scopes.some((scope) =>
			scope === CARD_SCOPE_PREFIX || scope.startsWith(`${CARD_SCOPE_PREFIX}.`),
		) || provider.capabilities?.cards === true
	);
}

function getProviderStatus(provider: TrueLayerProvider): string {
	return provider.release_status?.toLowerCase() || "active";
}

interface InstitutionSelectorProps {
	onConnectionSuccess: () => void;
	onConnectionError: (error: string) => void;
}

export function InstitutionSelector({
	onConnectionSuccess,
	onConnectionError,
}: InstitutionSelectorProps) {
	const [providers, setProviders] = useState<TrueLayerProvider[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedProvider, setSelectedProvider] =
		useState<TrueLayerProvider | null>(null);

	// Fetch providers on component mount
	useEffect(() => {
		const fetchProviders = async () => {
			try {
				setIsLoading(true);
				setError(null);

					// Fetch TrueLayer providers via our server-side API (avoids CORS)
					try {
						console.log("Fetching providers from server-side API...");
						const response = await fetch("/api/truelayer/providers", {
							cache: "no-store",
						});

					if (!response.ok) {
						throw new Error(`API request failed: ${response.status}`);
					}

					const data = await response.json();

					if (data.success) {
						console.log(
							`Successfully loaded ${data.supportedTotal} supported providers out of ${data.total} total`,
						);
						setProviders(data.providers);
					} else {
						throw new Error(data.message || "Failed to fetch providers");
					}
				} catch (apiError) {
					console.log(
						"Server-side TrueLayer API error, using mock data for development",
					);
					console.error("TrueLayer API Error:", apiError);
					// Mock TrueLayer providers for development (only in case of API failure)
					const mockTrueLayerProviders: TrueLayerProvider[] = [
						{
							provider_id: "ob-starling",
							display_name: "Starling",
							logo_url:
								"https://providers-assets.truelayer.com/ob-starling/logo.svg",
							logo_uri:
								"https://providers-assets.truelayer.com/ob-starling/logo.svg",
							country: "uk",
							country_code: "GB",
							scopes: [
								"info",
								"accounts",
								"balance",
								"transactions",
								"cards",
								"direct_debits",
								"standing_orders",
								"offline_access",
							],
							capabilities: {
								accounts: true,
								transactions: true,
								balance: true,
								cards: true,
								identity: true,
							},
						},
						{
							provider_id: "ob-hsbc",
							display_name: "HSBC",
							logo_url:
								"https://providers-assets.truelayer.com/ob-hsbc/logo.svg",
							logo_uri:
								"https://providers-assets.truelayer.com/ob-hsbc/logo.svg",
							country: "uk",
							country_code: "GB",
							scopes: [
								"info",
								"accounts",
								"balance",
								"transactions",
								"cards",
								"direct_debits",
								"standing_orders",
								"offline_access",
							],
							capabilities: {
								accounts: true,
								transactions: true,
								balance: true,
								cards: true,
								identity: true,
							},
						},
						{
							provider_id: "ob-lloyds",
							display_name: "Lloyds",
							logo_url:
								"https://providers-assets.truelayer.com/ob-lloyds/logo.svg",
							logo_uri:
								"https://providers-assets.truelayer.com/ob-lloyds/logo.svg",
							country: "uk",
							country_code: "GB",
							scopes: [
								"info",
								"accounts",
								"balance",
								"transactions",
								"cards",
								"direct_debits",
								"standing_orders",
								"offline_access",
							],
							capabilities: {
								accounts: true,
								transactions: true,
								balance: true,
								cards: true,
								identity: true,
							},
						},
					];
					setProviders(mockTrueLayerProviders);
				}
			} catch (err) {
				console.error("Error fetching providers:", err);
				setError("Failed to load available institutions. Please try again.");
			} finally {
				setIsLoading(false);
			}
		};

		fetchProviders();
	}, []);

	// Filter providers based on search term
	const filteredProviders = useMemo(() => {
		if (!searchTerm.trim()) {
			return providers;
		}

		const searchLower = searchTerm.toLowerCase();
		return providers.filter(
			(provider) =>
				provider.display_name.toLowerCase().includes(searchLower) ||
				provider.provider_id.toLowerCase().includes(searchLower),
		);
	}, [providers, searchTerm]);

	const handleConnect = async (provider: TrueLayerProvider) => {
		if (isConnecting) return;

		try {
			setIsConnecting(true);
			setSelectedProvider(provider);
			setError(null);

			// Call the connect API
			const response = await fetch("/api/accounts/connect", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "same-origin", // Include cookies for authentication
				body: JSON.stringify({
					providerId: provider.provider_id,
					institutionName: provider.display_name,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Connection failed");
			}

			// Redirect to TrueLayer OAuth flow
			window.location.href = data.authUrl;
		} catch (err) {
			console.error("Connection error:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to initiate connection";
			setError(errorMessage);
			onConnectionError(errorMessage);
			setIsConnecting(false);
			setSelectedProvider(null);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
			case "live":
				return "bg-green-500";
			case "beta":
			case "sandbox":
				return "bg-yellow-500";
			case "deprecated":
			case "retired":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Skeleton className="h-10 pl-8" />
				</div>
				<div className="grid gap-3">
					{LOADING_SKELETON_KEYS.map((key) => (
						<Skeleton key={key} className="h-20" />
					))}
				</div>
			</div>
		);
	}

	if (error && providers.length === 0) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-4">
			{/* Search Input */}
			<div className="space-y-2">
		<Label htmlFor="search">Search for your bank or card provider</Label>
				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						id="search"
				placeholder="e.g. Monzo, American Express, Barclays..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8"
					/>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Institution List */}
			<div className="space-y-2 max-h-96 overflow-y-auto">
				{filteredProviders.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-8">
							<Building className="h-12 w-12 text-muted-foreground mb-4" />
							<CardTitle className="text-lg mb-2">
								No institutions found
							</CardTitle>
							<CardDescription>
								{searchTerm
									? `No institutions match "${searchTerm}". Try a different search term.`
									: "No institutions are available at the moment."}
							</CardDescription>
						</CardContent>
					</Card>
				) : (
				filteredProviders.map((provider) => {
					const hasAccounts = supportsAccounts(provider);
					const hasCards = supportsCards(provider);
					const status = getProviderStatus(provider);
					const scopeBadges: JSX.Element[] = [];
					if (hasAccounts) {
						scopeBadges.push(
							<Badge key="accounts" variant="outline" className="text-xs">
								Accounts
							</Badge>,
						);
					}
					if (hasCards) {
						scopeBadges.push(
							<Badge
								key="cards"
								variant="outline"
								className="text-xs flex items-center gap-1"
							>
								<CreditCard className="h-3 w-3" />
								Cards
							</Badge>,
						);
					}
					const logoSrc =
						provider.logo_url || provider.logo_uri || provider.icon_uri || "";
					const regionLabel =
						provider.country_code?.toUpperCase() || provider.country?.toUpperCase();

					return (
						<Card
							key={provider.provider_id}
							className={`transition-all hover:shadow-md cursor-pointer ${
								selectedProvider?.provider_id === provider.provider_id
									? "ring-2 ring-primary"
									: ""
							}`}
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
											{logoSrc ? (
												<img
													src={logoSrc}
													alt={`${provider.display_name} logo`}
													className="w-full h-full object-contain"
												/>
											) : hasCards ? (
												<CreditCard className="h-5 w-5 text-muted-foreground" />
											) : (
												<Building className="h-5 w-5 text-muted-foreground" />
											)}
										</div>
										<div>
											<CardTitle className="text-base">
												{provider.display_name}
											</CardTitle>
											<CardDescription className="flex flex-wrap items-center gap-2 text-xs">
												<Badge
													variant="secondary"
													className={`${getStatusColor(status)} text-white capitalize`}
												>
													{status === "active" ? "Live" : status}
												</Badge>
												{scopeBadges}
												{regionLabel && <span>{regionLabel}</span>}
											</CardDescription>
										</div>
									</div>
									<Button
										onClick={() => handleConnect(provider)}
										disabled={isConnecting || (!hasAccounts && !hasCards)}
										size="sm"
									>
										{isConnecting &&
										selectedProvider?.provider_id === provider.provider_id ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Connecting...
											</>
										) : (
											"Connect"
										)}
									</Button>
								</div>
							</CardHeader>
						</Card>
					);
				})
				)}
			</div>

			{/* Footer Information */}
			<div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
				<p>🔒 Your data is encrypted and secure. We use bank-level security.</p>
				<p>📱 Connection happens through your bank's official login page.</p>
			</div>
		</div>
	);
}
