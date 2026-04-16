import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

type UploadKind = "image" | "lease";

function normalizeKind(value: FormDataEntryValue | null): UploadKind {
  return value === "lease" ? "lease" : "image";
}

export async function POST(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Upload failed. Ensure BLOB_READ_WRITE_TOKEN is set." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const propertyId = formData.get("propertyId");
  const roomId = formData.get("roomId");
  const kind = normalizeKind(formData.get("kind"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const uploadFile = file;

  if (uploadFile.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 20MB)." }, { status: 413 });
  }

  if (kind === "image") {
    if (!uploadFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed here." }, { status: 400 });
    }
  } else {
    if (uploadFile.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF uploads are allowed for lease agreements." }, { status: 400 });
    }
  }

  if (typeof propertyId !== "string" || propertyId.trim().length === 0) {
    return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
  }

  if (typeof roomId !== "string" || roomId.trim().length === 0) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const filename = (uploadFile.name || (kind === "lease" ? "lease-agreement.pdf" : "upload"))
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 180);

  const safePropertyId = propertyId.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  const safeRoomId = roomId.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  const pathname = `lem-accommodation/${safePropertyId}/${safeRoomId}/${kind}/${Date.now()}-${filename}`;

  async function upload(access: "public" | "private") {
    return put(pathname, uploadFile, {
      access,
      token,
      addRandomSuffix: false,
    });
  }

  if (kind === "lease") {
    try {
      const blob = await upload("private");
      return NextResponse.json({ url: blob.url, access: "private", kind });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "production"
              ? "Lease upload failed."
              : `Lease upload failed: ${message}. Ensure your Blob store supports private access.`,
        },
        { status: 500 },
      );
    }
  }

  try {
    const blob = await upload("public");
    return NextResponse.json({ url: blob.url, access: "public", kind });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const isPrivateStoreAccessError = typeof message === "string" && message.includes("Cannot use public access on a private store");

    if (isPrivateStoreAccessError) {
      try {
        const blob = await upload("private");
        return NextResponse.json({ url: blob.url, access: "private", kind });
      } catch (innerError) {
        const innerMessage = innerError instanceof Error ? innerError.message : "Upload failed";
        return NextResponse.json(
          {
            error: process.env.NODE_ENV === "production" ? "Upload failed." : `Upload failed: ${innerMessage}`,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "production" ? "Upload failed." : `Upload failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
