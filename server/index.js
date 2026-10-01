import express from 'express'
import { isAuthorized } from './auth.js'
import { extractAmount } from './extractAmount.js'

const app = express()
app.use(express.json({ limit: '15mb' }))

app.post('/api/extract-amount', async (req, res) => {
  if (!(await isAuthorized(req.headers.authorization))) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const { imageBase64, mediaType } = req.body ?? {}
  if (typeof imageBase64 !== 'string' || typeof mediaType !== 'string') {
    return res.status(400).json({ error: 'imageBase64 and mediaType are required' })
  }

  try {
    const result = await extractAmount({ imageBase64, mediaType })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'extraction failed' })
  }
})

const PORT = process.env.PORT || 3787
app.listen(PORT, () => {
  console.log(`Receipt extraction server listening on http://localhost:${PORT}`)
})
