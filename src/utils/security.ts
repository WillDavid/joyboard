export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function sanitize(str: string, maxLen = 200): string {
  return str
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLen)
}

export function isValidUsername(str: string): boolean {
  return /^[a-zA-Z0-9_-]{2,32}$/.test(str)
}

export function isNonEmpty(str: string, min = 1): boolean {
  return str.trim().length >= min
}

export function slugify(name: string): string {
  const map: Record<string, string> = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
    'é': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ú': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c', 'ñ': 'n'
  }
  return name
    .toLowerCase()
    .trim()
    .split('').map(c => map[c] || c).join('')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'untitled'
}
