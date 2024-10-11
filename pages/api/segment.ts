import type { NextApiRequest, NextApiResponse } from 'next'
import nodejieba from 'nodejieba'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { text } = req.body
    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const segmented = nodejieba.cut(text)
    res.status(200).json({ segmented })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}