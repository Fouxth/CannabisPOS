/**
 * Thermal Printer Manager supporting WebBluetooth, WebUSB, Network IP Printing,
 * and Browser Fallback Printing.
 */
import { EscPosEncoder } from './escpos';

export interface PrinterConfig {
  type: 'browser' | 'bluetooth' | 'webusb' | 'network';
  paperWidth: 58 | 80;
  ipAddress?: string;
  autoCut?: boolean;
  autoKickDrawer?: boolean;
}

export interface PrintableReceiptData {
  billNumber: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeTaxId?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountReceived: number;
  changeAmount: number;
  paymentMethod: string;
  cashierName: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  pointsEarned?: number;
  currentPointsBalance?: number;
}

/**
 * Format Receipt Data into ESC/POS binary buffer
 */
export function buildEscPosReceipt(data: PrintableReceiptData, config: PrinterConfig): Uint8Array {
  const encoder = new EscPosEncoder(config.paperWidth);

  // Kick cash drawer at start if enabled
  if (config.autoKickDrawer) {
    encoder.kickDrawer();
  }

  // Store Header
  encoder
    .align('center')
    .size('double-height')
    .bold(true)
    .line(data.storeName)
    .size('normal')
    .bold(false);

  if (data.storeAddress) encoder.line(data.storeAddress);
  if (data.storePhone) encoder.line(`Tel: ${data.storePhone}`);
  if (data.storeTaxId) encoder.line(`TAX ID: ${data.storeTaxId}`);

  encoder.rule('=');

  // Receipt Info
  encoder
    .align('left')
    .row('เลขที่บิล:', data.billNumber)
    .row('วันที่:', new Date(data.createdAt).toLocaleString('th-TH'))
    .row('พนักงาน:', data.cashierName);

  if (data.customerName || data.customerPhone) {
    encoder.row('สมาชิก:', `${data.customerName || ''} (${data.customerPhone || ''})`);
  }

  encoder.rule('-');

  // Items Header
  encoder.row('รายการ', 'จำนวน', 'รวม (฿)');
  encoder.rule('-');

  // Item Rows
  data.items.forEach((item) => {
    encoder.row(
      item.productName,
      item.quantity.toString(),
      item.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })
    );
  });

  encoder.rule('-');

  // Totals
  encoder
    .row('ยอดรวม:', `฿${data.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`);

  if (data.discountAmount > 0) {
    encoder.row('ส่วนลด:', `-฿${data.discountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`);
  }

  if (data.taxAmount > 0) {
    encoder.row('ภาษี (VAT 7%):', `฿${data.taxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`);
  }

  encoder
    .bold(true)
    .size('double-height')
    .row('สุทธิ:', `฿${data.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`)
    .size('normal')
    .bold(false);

  encoder.rule('-');

  // Payment Breakdown
  encoder
    .row('วิธีชำระ:', data.paymentMethod.toUpperCase())
    .row('รับเงิน:', `฿${data.amountReceived.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`);

  if (data.changeAmount > 0) {
    encoder.row('เงินทอน:', `฿${data.changeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`);
  }

  // Loyalty Points Summary (if applicable)
  if (data.pointsEarned !== undefined || data.currentPointsBalance !== undefined) {
    encoder.rule('-');
    if (data.pointsEarned && data.pointsEarned > 0) {
      encoder.row('แต้มที่ได้รับ:', `+${data.pointsEarned} แต้ม`);
    }
    if (data.currentPointsBalance !== undefined) {
      encoder.row('แต้มสะสมคงเหลือ:', `${data.currentPointsBalance} แต้ม`);
    }
  }

  // Footer
  encoder
    .rule('=')
    .align('center')
    .line('ขอบคุณที่ใช้บริการ')
    .line('Thank you for your visit');

  if (config.autoCut !== false) {
    encoder.cut();
  }

  return encoder.encode();
}

/**
 * Print via WebBluetooth (SPP profile)
 */
export async function printViaBluetooth(bytes: Uint8Array): Promise<void> {
  if (!navigator.bluetooth) {
    throw new Error('เบราว์เซอร์นี้ไม่รองรับ WebBluetooth (รองรับบน Chrome / Edge / Android)');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', 0xff00, 0xaf00],
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error('ไม่สามารถเชื่อมต่อเครื่องพิมพ์บลูทูธได้');

  const services = await server.getPrimaryServices();
  let writeChar: BluetoothRemoteGATTCharacteristic | null = null;

  for (const service of services) {
    const chars = await service.getCharacteristics();
    for (const c of chars) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        writeChar = c;
        break;
      }
    }
    if (writeChar) break;
  }

  if (!writeChar) throw new Error('ไม่พบช่องทางส่งข้อมูลไปยังเครื่องพิมพ์บลูทูธ');

  // Chunk bytes to 512-byte blocks
  const CHUNK_SIZE = 512;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    await writeChar.writeValue(chunk);
  }
}

/**
 * Print via WebUSB
 */
export async function printViaWebUSB(bytes: Uint8Array): Promise<void> {
  if (!navigator.usb) {
    throw new Error('เบราว์เซอร์นี้ไม่รองรับ WebUSB (รองรับบน Chrome / Edge)');
  }

  const device = await navigator.usb.requestDevice({ filters: [] });
  await device.open();
  await device.selectConfiguration(1);
  await device.claimInterface(0);

  const endpoint = device.configuration?.interfaces[0].alternate.endpoints.find(
    (e) => e.direction === 'out'
  );

  if (!endpoint) throw new Error('ไม่พบพอร์ตสำหรับส่งข้อมูลเครื่องพิมพ์ USB');

  await device.transferOut(endpoint.endpointNumber, bytes);
}
