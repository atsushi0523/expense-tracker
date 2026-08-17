export interface OcrResult {
  amount: number | null
  date: string | null // YYYY-MM-DD, as read from the receipt
  storeName: string | null
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // reader.result is a data URL ("data:<mediaType>;base64,<data>");
      // the API only wants the base64 payload after the comma.
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function recognizeReceiptAmount(image: File | Blob): Promise<OcrResult> {
  const imageBase64 = await fileToBase64(image)
  const mediaType = image.type || 'image/jpeg'

  const res = await fetch('/api/extract-amount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType }),
  })

  if (!res.ok) throw new Error('extraction failed')
  const data = await res.json()
  return { amount: data.amount ?? null, date: data.date ?? null, storeName: data.storeName ?? null }
}
