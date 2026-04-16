import { del, get } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const deleteSchema = z.object({
	url: z.string().min(1),
});

function isAllowedBlobHost(hostname: string) {
	return hostname.endsWith(".blob.vercel-storage.com");
}

function extractTarget(urlOrProxy: string): { kind: "url"; value: string } | { kind: "pathname"; value: string } {
	const trimmed = urlOrProxy.trim();

	// If the UI passes our proxy URL (/api/blob?url=...), extract the underlying blob URL.
	if (trimmed.startsWith("/api/blob") || trimmed.startsWith("/api/admin/blob")) {
		const proxyUrl = new URL(trimmed, "http://local");
		const raw = proxyUrl.searchParams.get("url");
		if (!raw) {
			throw new Error("Missing url");
		}
		return { kind: "url", value: raw };
	}

	// Absolute URL
	if (/^https?:\/\//i.test(trimmed)) {
		return { kind: "url", value: trimmed };
	}

	// Otherwise treat it as a pathname.
	return { kind: "pathname", value: trimmed };
}

export async function GET(request: NextRequest) {
	const token = process.env.BLOB_READ_WRITE_TOKEN;
	if (!token) {
		return NextResponse.json({ error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 });
	}

	const blobUrlParam = request.nextUrl.searchParams.get("url");
	if (!blobUrlParam) {
		return new NextResponse("Missing url", { status: 400 });
	}

	let blobUrl: URL;
	try {
		blobUrl = new URL(blobUrlParam);
	} catch {
		return new NextResponse("Invalid url", { status: 400 });
	}

	if (!isAllowedBlobHost(blobUrl.hostname)) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const access = blobUrl.hostname.includes(".private.") ? "private" : "public";

	const result = await get(blobUrl.toString(), {
		access,
		token,
	});

	if (!result || result.statusCode !== 200 || !result.stream) {
		return new NextResponse("Not found", { status: 404 });
	}

	const headers = new Headers();
	if (result.blob.contentType) {
		headers.set("Content-Type", result.blob.contentType);
	}
	if (result.blob.etag) {
		headers.set("ETag", result.blob.etag);
	}

	// Admin-only download proxy (no caching).
	headers.set("Cache-Control", "private, no-store");
	if (result.blob.contentType === "application/pdf") {
		headers.set("Content-Disposition", "attachment; filename=\"lease-agreement.pdf\"");
	}

	return new NextResponse(result.stream, {
		status: 200,
		headers,
	});
}

export async function DELETE(request: Request) {
	const token = process.env.BLOB_READ_WRITE_TOKEN;
	if (!token) {
		return NextResponse.json({ error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 });
	}

	const raw = await request.json().catch(() => null);
	const parsed = deleteSchema.safeParse(raw);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid delete payload" }, { status: 400 });
	}

	let target: ReturnType<typeof extractTarget>;
	try {
		target = extractTarget(parsed.data.url);
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Invalid url" },
			{ status: 400 },
		);
	}

	if (target.kind === "url") {
		let blobUrl: URL;
		try {
			blobUrl = new URL(target.value);
		} catch {
			return NextResponse.json({ error: "Invalid url" }, { status: 400 });
		}

		if (!isAllowedBlobHost(blobUrl.hostname)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		await del(blobUrl.toString(), { token });
		return NextResponse.json({ ok: true });
	}

	// Basic pathname safety: only allow deleting our own uploaded folder.
	if (!target.value.startsWith("lem-accommodation/")) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	await del(target.value, { token });
	return NextResponse.json({ ok: true });
}
