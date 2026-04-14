import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const token = process.env.BLOB_READ_WRITE_TOKEN;
	if (!token) {
		return NextResponse.json(
			{ error: "Upload failed. Ensure BLOB_READ_WRITE_TOKEN is set." },
			{ status: 500 },
		);
	}

	const formData = await request.formData();
	const file = formData.get("file");
	const propertyId = formData.get("propertyId");
	const roomId = formData.get("roomId");

	if (!(file instanceof File)) {
		return NextResponse.json({ error: "Missing file" }, { status: 400 });
	}

		const uploadFile = file;

	if (typeof propertyId !== "string" || propertyId.trim().length === 0) {
		return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
	}

	if (typeof roomId !== "string" || roomId.trim().length === 0) {
		return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
	}

	const filename = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "-");
	const safePropertyId = propertyId.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
	const safeRoomId = roomId.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
		const pathname = `lem-accommodation/${safePropertyId}/${safeRoomId}/${Date.now()}-${filename}`;

		async function upload(access: "public" | "private") {
			return put(pathname, uploadFile, {
				access,
				token,
				addRandomSuffix: false,
			});
		}

	try {
			let blob = await upload("public");
			return NextResponse.json({ url: blob.url, access: "public" });
	} catch (error) {
			const message = error instanceof Error ? error.message : "Upload failed";
			const isPrivateStoreAccessError =
				typeof message === "string" &&
				message.includes("Cannot use public access on a private store");

			if (isPrivateStoreAccessError) {
				try {
					const blob = await upload("private");
					return NextResponse.json({ url: blob.url, access: "private" });
				} catch (innerError) {
					const innerMessage = innerError instanceof Error ? innerError.message : "Upload failed";
					return NextResponse.json(
						{
							error:
								process.env.NODE_ENV === "production"
									? "Upload failed."
									: `Upload failed: ${innerMessage}`,
						},
						{ status: 500 },
					);
				}
			}

			return NextResponse.json(
				{
					error:
						process.env.NODE_ENV === "production"
							? "Upload failed."
							: `Upload failed: ${message}`,
				},
				{ status: 500 },
			);
	}
}
