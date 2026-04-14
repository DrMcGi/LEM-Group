import { Suspense } from "react";
import { AdminLoginClient } from "./login-client";

export default function AdminLoginPage() {
	return (
		<Suspense
			fallback={
				<div className="mx-auto w-full max-w-md px-4 py-10">
					<h1 className="text-2xl font-semibold tracking-tight">Admin Login</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Loading…
					</p>
				</div>
			}
		>
			<AdminLoginClient />
		</Suspense>
	);
}
