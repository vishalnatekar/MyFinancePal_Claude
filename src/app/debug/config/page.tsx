"use client";

import { useState } from "react";

export default function ConfigDebugPage() {
	const [clientId, setClientId] = useState("");
	const [environment, setEnvironment] = useState("");

	const fetchConfig = async () => {
		try {
			const response = await fetch("/api/debug/config");
			const data = await response.json();
			setClientId(data.clientId);
			setEnvironment(data.environment);
		} catch (error) {
			console.error("Failed to fetch config:", error);
		}
	};

	return (
		<div className="container mx-auto p-8">
			<h1 className="text-2xl font-bold mb-4">TrueLayer Configuration Debug</h1>

			<button
				onClick={fetchConfig}
				className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
			>
				Check Current Config
			</button>

			{clientId && (
				<div className="bg-gray-100 p-4 rounded">
					<h3 className="font-bold text-lg mb-2">Current Configuration:</h3>
					<div className="space-y-2">
						<p>
							<strong>Client ID:</strong> {clientId}
						</p>
						<p>
							<strong>Environment:</strong> {environment}
						</p>
						<p>
							<strong>Expected Redirect URI:</strong>{" "}
							http://localhost:3000/api/accounts/callback
						</p>
					</div>

					<div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
						<h4 className="font-bold text-yellow-800">
							TrueLayer Console Checklist:
						</h4>
						<ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
							<li>Go to https://console.truelayer.com/</li>
							<li>
								Make sure you're in <strong>{environment.toUpperCase()}</strong>{" "}
								environment
							</li>
							<li>
								Find application with Client ID: <strong>{clientId}</strong>
							</li>
							<li>
								Add this EXACT redirect URI:{" "}
								<strong>http://localhost:3000/api/accounts/callback</strong>
							</li>
							<li>Save changes and wait 2-3 minutes</li>
						</ol>
					</div>
				</div>
			)}
		</div>
	);
}
