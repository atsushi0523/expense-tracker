import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(express.json({ limit: '15mb' }))

const client = new Anthropic()

const AMOUNT_SCHEMA = {
  type: 'object',
  properties: {
    labels_found: {
      type: 'array',
      items: { type: 'string' },
      description: 'Every money-related label printed on the receipt, transcribed exactly as shown (e.g. "合計", "お預り", "お釣り"), in the order they appear.',
    },
    total_label: {
      type: ['string', 'null'],
      description: 'Which single label from labels_found identifies the total the customer paid (合計/総合計/お会計/ご請求 or equivalent). null if none is present.',
    },
    amount: {
      type: ['integer', 'null'],
      description: 'The yen amount printed next to total_label. null if it cannot be determined from the image.',
    },
    date: {
      type: ['string', 'null'],
      description:
        'The purchase date printed on the receipt, converted to ISO format YYYY-MM-DD (4-digit Western year, zero-padded month/day). null if no date is legible on the receipt.',
    },
    store_name: {
      type: ['string', 'null'],
      description:
        'The name of the store/restaurant the receipt is from (e.g. "セブンイレブン渋谷店", "スターバックス"), as printed on the receipt. Prefer the specific branch name if shown, otherwise the chain/brand name. null if no store name is legible.',
    },
  },
  required: ['labels_found', 'total_label', 'amount', 'date', 'store_name'],
  additionalProperties: false,
}

function buildPrompt() {
  const today = new Date()
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return `This is a photo of a Japanese store receipt (レシート). Today's date is ${todayIso} — use this only to resolve ambiguous 2-digit years or era conversions, NOT as a guess for the receipt's own date.

Receipts print several different amounts, and they are easy to confuse:
- 合計 / 総合計 / お会計 / ご請求 / 小計+税 → the total the customer must pay. THIS is what you want.
- お預り / 預り金額 → cash the customer handed over. NOT the total — usually a rounder number.
- お釣り / おつり / 釣銭 → change handed back to the customer. NOT the total — this is money leaving the register, the opposite of what was paid.
- ポイント, 割引, 値引 → discounts/points, not the total.
- Phone numbers, barcode numbers, receipt/register IDs → not amounts at all.

お預り and お釣り almost always appear directly below or right after the total line — do not let their proximity make you pick them by mistake. If both お預り and お釣り are present, the total equals お預り minus お釣り, and it should also be printed explicitly on its own line; use that printed total line, not a computed one, unless no total line exists.

First list every money-related label you can read on the receipt (labels_found), then identify which one is the actual total (total_label), then report that line's amount in yen (amount). If no total line is present, set total_label and amount to null.

Also find the purchase date, usually printed near the top or bottom of the receipt, often next to a time (HH:MM) or register/staff number. It may appear in any of these forms — convert whichever you find to ISO YYYY-MM-DD:
- Western year: 2024/03/15, 2024-03-15, 2024年3月15日, 24.03.15 (assume 20xx for a 2-digit year)
- Japanese era year: 令和6年3月15日 or R6.3.15 (令和 = Reiwa, year N → 2018+N), 平成31年5月1日 or H31.5.1 (平成 = Heisei, year N → 1988+N)
If no date is legible anywhere on the receipt, set date to null — do not guess or default to today's date.

Also find the store name (store_name) — usually the largest text at the very top of the receipt, sometimes as a logo, or labeled 加盟店名/店舗名. If a specific branch name is shown (e.g. "○○渋谷店"), include it; otherwise use the chain/brand name alone. Do not use a corporate legal name buried in the fine print (e.g. "株式会社○○") if a more recognizable store/brand name is also present. If no store name is legible anywhere, set store_name to null.`
}

app.post('/api/extract-amount', async (req, res) => {
  const { imageBase64, mediaType } = req.body ?? {}
  if (typeof imageBase64 !== 'string' || typeof mediaType !== 'string') {
    return res.status(400).json({ error: 'imageBase64 and mediaType are required' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      output_config: { format: { type: 'json_schema', schema: AMOUNT_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: buildPrompt() },
          ],
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const parsed = textBlock ? JSON.parse(textBlock.text) : { amount: null, date: null, store_name: null }
    res.json({ amount: parsed.amount, date: parsed.date, storeName: parsed.store_name })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'extraction failed' })
  }
})

const PORT = process.env.PORT || 3787
app.listen(PORT, () => {
  console.log(`Receipt extraction server listening on http://localhost:${PORT}`)
})
