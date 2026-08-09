/**
 * ESC/POS Binary Command Encoder for 58mm and 80mm Thermal Receipt Printers
 * Supports Thai text encoding (TIS-620 / CP874 / UTF-8), text formatting,
 * table columns, cash drawer kick, and paper auto-cut.
 */

// ESC/POS Command Constants
export const COMMANDS = {
  RESET: [0x1b, 0x40], // ESC @ - Initialize printer
  ALIGN_LEFT: [0x1b, 0x61, 0x00],
  ALIGN_CENTER: [0x1b, 0x61, 0x01],
  ALIGN_RIGHT: [0x1b, 0x61, 0x02],
  TEXT_NORMAL: [0x1d, 0x21, 0x00],
  TEXT_DOUBLE_HEIGHT: [0x1d, 0x21, 0x01],
  TEXT_DOUBLE_WIDTH: [0x1d, 0x21, 0x10],
  TEXT_DOUBLE_SIZE: [0x1d, 0x21, 0x11],
  BOLD_ON: [0x1b, 0x45, 0x01],
  BOLD_OFF: [0x1b, 0x45, 0x00],
  LINE_FEED: [0x0a],
  CUT_PAPER: [0x1d, 0x56, 0x42, 0x00], // GS V 66 0 - Partial cut
  KICK_DRAWER: [0x1b, 0x70, 0x00, 0x19, 0xfa], // ESC p 0 25 250 - Kick cash drawer pin 2
  SELECT_CODEPAGE_THAI: [0x1b, 0x74, 0x1a], // ESC t 26 - CP874 Thai
};

/**
 * Encode string to TIS-620 / CP874 byte array for Thai receipt printers
 */
export function encodeThaiText(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code >= 0x0e01 && code <= 0x0e5b) {
      // Thai Unicode block 0x0E01 - 0x0E5B -> CP874 0xA1 - 0xFB
      bytes.push(code - 0x0e01 + 0xa1);
    } else {
      bytes.push(0x3f); // '?' for unmappable characters
    }
  }
  return new Uint8Array(bytes);
}

export class EscPosEncoder {
  private buffer: number[] = [];
  private width: 58 | 80 = 80;

  constructor(paperWidth: 58 | 80 = 80) {
    this.width = paperWidth;
    this.reset();
  }

  reset(): this {
    this.buffer = [...COMMANDS.RESET, ...COMMANDS.SELECT_CODEPAGE_THAI];
    return this;
  }

  align(alignment: 'left' | 'center' | 'right'): this {
    if (alignment === 'center') this.buffer.push(...COMMANDS.ALIGN_CENTER);
    else if (alignment === 'right') this.buffer.push(...COMMANDS.ALIGN_RIGHT);
    else this.buffer.push(...COMMANDS.ALIGN_LEFT);
    return this;
  }

  bold(enable: boolean = true): this {
    this.buffer.push(...(enable ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF));
    return this;
  }

  size(size: 'normal' | 'double-height' | 'double-width' | 'double'): this {
    if (size === 'double') this.buffer.push(...COMMANDS.TEXT_DOUBLE_SIZE);
    else if (size === 'double-height') this.buffer.push(...COMMANDS.TEXT_DOUBLE_HEIGHT);
    else if (size === 'double-width') this.buffer.push(...COMMANDS.TEXT_DOUBLE_WIDTH);
    else this.buffer.push(...COMMANDS.TEXT_NORMAL);
    return this;
  }

  text(str: string): this {
    const encoded = encodeThaiText(str);
    encoded.forEach((byte) => this.buffer.push(byte));
    return this;
  }

  line(str: string = ''): this {
    if (str) this.text(str);
    this.buffer.push(...COMMANDS.LINE_FEED);
    return this;
  }

  rule(char: string = '-'): this {
    const charWidth = this.width === 58 ? 32 : 48;
    this.line(char.repeat(charWidth));
    return this;
  }

  row(col1: string, col2: string, col3?: string): this {
    const maxChars = this.width === 58 ? 32 : 48;
    if (col3 !== undefined) {
      // 3 columns: Name (Left), Qty (Center), Price (Right)
      const qtyWidth = 6;
      const priceWidth = 10;
      const nameWidth = maxChars - qtyWidth - priceWidth;
      const truncatedName = col1.slice(0, nameWidth).padEnd(nameWidth, ' ');
      const paddedQty = col2.padStart(qtyWidth, ' ');
      const paddedPrice = col3.padStart(priceWidth, ' ');
      this.line(truncatedName + paddedQty + paddedPrice);
    } else {
      // 2 columns: Label (Left), Value (Right)
      const valueWidth = Math.min(col2.length + 2, 16);
      const labelWidth = maxChars - valueWidth;
      const truncatedLabel = col1.slice(0, labelWidth).padEnd(labelWidth, ' ');
      const paddedValue = col2.padStart(valueWidth, ' ');
      this.line(truncatedLabel + paddedValue);
    }
    return this;
  }

  cut(): this {
    this.line().line().line();
    this.buffer.push(...COMMANDS.CUT_PAPER);
    return this;
  }

  kickDrawer(): this {
    this.buffer.push(...COMMANDS.KICK_DRAWER);
    return this;
  }

  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
