export function resolveBlobUrl(input: string) {
	if (!input) return input;
	if (input.startsWith("/api/blob?")) return input;

	if (input.startsWith("http://") || input.startsWith("https://")) {
		try {
			const url = new URL(input);
			if (url.hostname.endsWith(".blob.vercel-storage.com")) {
				return `/api/blob?url=${encodeURIComponent(input)}`;
			}
		} catch {
			return input;
		}
	}

	return input;
}
