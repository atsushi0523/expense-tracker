import { extractAmount } from '../server/extractAmount.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const { imageBase64, mediaType } = req.body ?? {}
  if (typeof imageBase64 !== 'string' || typeof mediaType !== 'string') {
    res.status(400).json({ error: 'imageBase64 and mediaType are required' })
    return
  }

  try {
    const result = await extractAmount({ imageBase64, mediaType })
    res.status(200).json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'extraction failed' })
  }
}
