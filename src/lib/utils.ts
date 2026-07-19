import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(amount: number, currency: 'USD' | 'KHR'): string {
  const n = Number(amount) || 0
  if (currency === 'USD') return '$' + n.toFixed(2)
  return '៛' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function compressImage(file: File, maxDimension = 1024, quality = 0.65): Promise<File> {
  if (!file.type.startsWith('image/')) return Promise.resolve(file)

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round(height * maxDimension / width)
            width = maxDimension
          } else {
            width = Math.round(width * maxDimension / height)
            height = maxDimension
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }))
        }, 'image/jpeg', quality)
      }
      img.onerror = () => resolve(file)
      img.src = e.target!.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export function escapeHtml(s: string): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHrs = Math.floor(diffMs / 3600000)

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (diffHrs < 1) {
    const mins = Math.floor(diffMs / 60000)
    return mins <= 1 ? 'Just now' : `${mins}m ago`
  }
  if (diffHrs < 6) return `${diffHrs}h ago`
  if (d.toDateString() === now.toDateString()) return time
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + time
  }
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDuration(startIso: string): string {
  const start = new Date(startIso)
  const now = new Date()
  const ms = now.getTime() - start.getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h < 1) return `${m}m`
  return `${h}h ${m}m`
}
