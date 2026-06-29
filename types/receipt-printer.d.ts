declare module '../../../../Receipt/ReceiptPrinter' {
  import { NextApiRequest, NextApiResponse } from 'next';
  export function handlePrinterApiRoute(req: NextApiRequest, res: NextApiResponse): Promise<void>;
}
