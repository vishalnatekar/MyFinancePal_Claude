"use client";

import type { TrueLayerProvider } from "@/types/truelayer";
import { useState } from "react";

interface ProviderSummary {
	id: string;
	name: string;
	scopes: string[];
}

type DebugResult =
	| {
			context: "direct";
			totalProviders: number;
			ukProviders: number;
			sampleUkProviders: ProviderSummary[];
	  }
	| {
			context: "server";
			totalProviders: number;
			ukProviders: number;
			sampleUkProviders: ProviderSummary[];
	  };

export default function TrueLayerDebugPage() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<DebugResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const testTrueLayer = async () => {
		try {
			setLoading(true);
			setError(null);
			setResult(null);

			console.log("Testing TrueLayer API...");

			// Test 1: Get client credentials token
			const tokenResponse = await fetch(
				"https://auth.truelayer.com/connect/token",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						grant_type: "client_credentials",
						client_id: "financepal-415037",
						client_secret: "e298a573-6c39-4c5f-9d8f-f31bbb43882c",
						scope: "info",
					}),
				},
			);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				throw new Error(
					`Token request failed: ${tokenResponse.status} ${errorText}`,
				);
			}

			const tokenData = await tokenResponse.json();
			console.log("✅ Token obtained:", tokenData);

			// Test 2: Get providers
			const providersResponse = await fetch(
				"https://auth.truelayer.com/api/providers",
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${tokenData.access_token}`,
					},
				},
			);

			if (!providersResponse.ok) {
				const errorText = await providersResponse.text();
				throw new Error(
					`Providers request failed: ${providersResponse.status} ${errorText}`,
				);
			}

			const providers: TrueLayerProvider[] = await providersResponse.json();
			console.log("✅ Providers obtained:", providers.length);

			// Filter UK providers
			const ukProviders = providers.filter(
				(provider) =>
					(provider.country?.toLowerCase() === "uk" ||
						provider.country_code?.toLowerCase() === "gb") &&
					provider.scopes.includes("accounts"),
			);

			setResult({
				context: "direct",
				totalProviders: providers.length,
				ukProviders: ukProviders.length,
				sampleUkProviders: ukProviders.slice(0, 10).map((provider) => ({
					id: provider.provider_id,
					name: provider.display_name,
					scopes: provider.scopes.slice(0, 5),
				})),
			});
		} catch (err) {
			console.error("TrueLayer test failed:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	const testServerApi = async () => {
		try {
			setLoading(true);
			setError(null);
			setResult(null);

			console.log("Testing server-side API...");
			const response = await fetch("/api/truelayer/providers");

			if (!response.ok) {
				throw new Error(`Server API failed: ${response.status}`);
			}

			const data = await response.json();
			console.log("✅ Server API response:", data);

			if (data.success) {
				const providerSummaries: ProviderSummary[] = data.providers
					.slice(0, 10)
					.map((provider: TrueLayerProvider) => ({
						id: provider.provider_id,
						name: provider.display_name,
						scopes:
							provider.scopes.length > 0
								? provider.scopes
								: Object.keys(provider.capabilities || {}),
					}));

				setResult({
					context: "server",
					totalProviders: data.total,
					ukProviders: data.ukTotal,
					sampleUkProviders: providerSummaries,
				});
			} else {
				throw new Error(data.message || "Server API returned error");
			}
		} catch (err) {
			console.error("Server API test failed:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-8">
			<h1 className="text-2xl font-bold mb-4">TrueLayer Debug Page</h1>

			<div className="space-y-4">
				<button
					type="button"
					onClick={testTrueLayer}
					disabled={loading}
					className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
				>
					{loading ? "Testing..." : "Test Direct API"}
				</button>

				<button
					type="button"
					onClick={testServerApi}
					disabled={loading}
					className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
				>
					{loading ? "Testing..." : "Test Server API"}
				</button>
			</div>

			{error && (
				<div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
					<h3 className="font-bold text-red-800">Error:</h3>
					<pre className="text-red-700 text-sm">{error}</pre>
				</div>
			)}

			{result && (
				<div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
					<h3 className="font-bold text-green-800">Success:</h3>
					<pre className="text-green-700 text-sm">
						{JSON.stringify(result, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
