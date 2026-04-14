import { get } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isAllowedBlobHost(hostname: string) {
	return hostname.endsWith(".blob.vercel-storage.com");
}

export async function GET(request: NextRequest) {
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
		token: process.env.BLOB_READ_WRITE_TOKEN,
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

	// Blob URLs are immutable in this app (timestamped pathnames), so this is safe and fast.
	headers.set("Cache-Control", "public, max-age=31536000, immutable");

	return new NextResponse(result.stream, {
		status: 200,
		headers,
	});
}
