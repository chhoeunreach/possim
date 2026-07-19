import { useRef, useState } from "react"
import { Upload, X, Camera } from "lucide-react"
import { api } from "@/lib/api"
import { compressImage, formatBytes } from "@/lib/utils"
import { i18n } from "@/lib/i18n"

interface FileUploadProps {
  onUpload: (url: string) => void
  hint?: string
}

export function FileUpload({ onUpload, hint }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus(i18n.t('upload.compress', { size: formatBytes(file.size) }))
    setUploading(true)

    try {
      const compressed = await compressImage(file)

      const previewReader = new FileReader()
      previewReader.onload = (ev) => {
        setPreview(ev.target?.result as string)
      }
      previewReader.readAsDataURL(compressed)

      const sizeInfo = formatBytes(file.size) + ' → ' + formatBytes(compressed.size)
      setStatus(i18n.t('upload.uploading', { size: sizeInfo }))

      const result = await api.uploadInvoice(compressed)
      onUpload(result.url)
      setStatus(i18n.t('upload.done', { size: sizeInfo }))
    } catch (err) {
      setStatus(i18n.t('upload.fail'))
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setPreview(null)
    setStatus("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
            <p className="text-xs text-muted-foreground mt-2">{status}</p>
            <button
              onClick={(e) => { e.stopPropagation(); reset() }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center gap-2">
              <Camera className="h-8 w-8 text-muted-foreground/40" />
              <Upload className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {hint || i18n.t('open.photo.hint')}
            </p>
            {status && <p className="text-xs text-primary">{status}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
