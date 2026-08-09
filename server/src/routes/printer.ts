import { Router, Request, Response } from 'express';
import net from 'net';

export const printerRouter = Router();

/**
 * POST /api/printer/network-print
 * Sends raw ESC/POS binary data to Network Printer IP on port 9100
 */
printerRouter.post('/network-print', async (req: Request, res: Response) => {
  const { ipAddress, port = 9100, base64Data } = req.body;

  if (!ipAddress || !base64Data) {
    return res.status(400).json({ message: 'Missing ipAddress or base64Data' });
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const client = new net.Socket();

    client.connect(Number(port), ipAddress, () => {
      client.write(buffer, () => {
        client.destroy();
        return res.json({ success: true, message: 'พิมพ์ใบเสร็จผ่านเครื่องพิมพ์ Network สำเร็จ' });
      });
    });

    client.on('error', (err) => {
      client.destroy();
      console.error('Network printer socket error:', err);
      return res.status(500).json({ message: `ไม่สามารถเชื่อมต่อเครื่องพิมพ์ IP ${ipAddress}:${port}` });
    });

    client.setTimeout(5000, () => {
      client.destroy();
      return res.status(504).json({ message: 'หมดเวลาเชื่อมต่อเครื่องพิมพ์ Network (Timeout)' });
    });

  } catch (error: any) {
    console.error('Network print error:', error);
    return res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาดในการพิมพ์ผ่าน Network' });
  }
});
