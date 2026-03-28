import { randomBytes } from 'crypto';

export function makeListingSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'listing'}-${randomBytes(4).toString('hex')}`;
}
