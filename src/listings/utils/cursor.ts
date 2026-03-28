export function encodeListingCursor(publishedAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ p: publishedAt.toISOString(), id }), 'utf8').toString(
    'base64url',
  );
}

export function decodeListingCursor(
  cursor: string,
): { publishedAt: Date; id: string } | null {
  try {
    const j = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      p: string;
      id: string;
    };
    return { publishedAt: new Date(j.p), id: j.id };
  } catch {
    return null;
  }
}
