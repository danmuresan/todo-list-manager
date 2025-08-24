/**
 * Get headers utility.
 * @param authToken Auth token for 'Authorization' header
 * @param contentType Optional content type for 'Content-Type' header
 * @returns headers object
 */
export function getHeaders(authToken: string, contentType?: string) {
	return {
		headers: {
			Authorization: `Bearer ${authToken}`,
			...(contentType ? { 'Content-Type': contentType } : {}),
		},
	};
}
