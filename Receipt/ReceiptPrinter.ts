import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Stub for ReceiptPrinter module.
 * Replace this with the actual implementation when available.
 */
export async function handlePrinterApiRoute(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  res.status(501).json({ message: 'Receipt printer not implemented' });
}
