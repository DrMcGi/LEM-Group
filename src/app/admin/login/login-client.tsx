"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AdminLoginClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next") || "/admin";

	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as
					| { error?: string }
					| null;
				setError(data?.error || "Login failed");
				return;
			}

			router.replace(next);
		} catch {
			setError("Login failed");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-md px-4 py-10">
			<h1 className="text-2xl font-semibold tracking-tight">Admin Login</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Sign in to manage enquiries and properties.
			</p>

			<form onSubmit={onSubmit} className="mt-6 space-y-4">
				<div className="space-y-2">
					<label className="text-sm font-medium" htmlFor="email">
						Email
					</label>
					<input
						id="email"
						type="email"
						autoComplete="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium" htmlFor="password">
						Password
					</label>
					<input
						id="password"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
					/>
				</div>

				{error ? (
					<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{error}
					</div>
				) : null}

				<button
					type="submit"
					disabled={isLoading}
					className="inline-flex h-10 w-full items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity disabled:opacity-60"
				>
					{isLoading ? "Signing in…" : "Sign in"}
				</button>
			</form>
		</div>
	);
}
