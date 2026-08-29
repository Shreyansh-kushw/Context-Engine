export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`
}

export const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif',
] as const

export const ACCEPTED_ATTR = ACCEPTED_EXTENSIONS.join(',')

export function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export type FileKind = 'pdf' | 'text' | 'image' | 'other'

export function fileKind(file: File): FileKind {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.txt')) return 'text'
  if (/\.(png|jpe?g|webp|gif|bmp|tiff?)$/.test(name)) return 'image'
  return 'other'
}
