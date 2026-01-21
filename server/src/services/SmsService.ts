import { PrismaClient } from '@prisma/client';
import { getSettingValue, DEFAULT_SETTINGS } from '../utils/helpers';

// Define item type for sales
interface SaleItem {
    name: string;
    quantity: number;
    price: number;
}

// Flex Message Templates
const createSalesFlexMessage = (saleNumber: string, total: number, items: SaleItem[]) => ({
    type: 'flex',
    altText: `มีรายการขายใหม่ #${saleNumber}`,
    contents: {
        type: 'bubble',
        size: 'mega',
        header: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                        {
                            type: 'text',
                            text: '💰',
                            size: 'xxl',
                            flex: 0
                        },
                        {
                            type: 'text',
                            text: 'รายการขายใหม่',
                            color: '#ffffff',
                            size: 'xl',
                            weight: 'bold',
                            margin: 'md',
                            flex: 1
                        }
                    ],
                    alignItems: 'center'
                }
            ],
            backgroundColor: '#10b981',
            paddingAll: '20px'
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: `#${saleNumber}`,
                    weight: 'bold',
                    size: 'md',
                    color: '#666666'
                },
                {
                    type: 'separator',
                    margin: 'lg'
                },
                // Items list
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'lg',
                    spacing: 'sm',
                    contents: items.slice(0, 5).map(item => ({
                        type: 'box' as const,
                        layout: 'horizontal' as const,
                        contents: [
                            {
                                type: 'text' as const,
                                text: item.name,
                                size: 'sm' as const,
                                color: '#333333',
                                flex: 3,
                                wrap: true
                            },
                            {
                                type: 'text' as const,
                                text: `x${item.quantity}`,
                                size: 'sm' as const,
                                color: '#666666',
                                align: 'center' as const,
                                flex: 1
                            },
                            {
                                type: 'text' as const,
                                text: `฿${item.price.toLocaleString()}`,
                                size: 'sm' as const,
                                color: '#10b981',
                                align: 'end' as const,
                                flex: 2
                            }
                        ]
                    }))
                },
                ...(items.length > 5 ? [{
                    type: 'text' as const,
                    text: `... และอีก ${items.length - 5} รายการ`,
                    size: 'xs' as const,
                    color: '#999999',
                    margin: 'sm' as const
                }] : []),
                {
                    type: 'separator',
                    margin: 'lg'
                },
                {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'lg',
                    contents: [
                        {
                            type: 'text',
                            text: 'ยอดรวม',
                            size: 'lg',
                            color: '#666666',
                            weight: 'bold',
                            flex: 1
                        },
                        {
                            type: 'text',
                            text: `฿${total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                            size: 'xl',
                            weight: 'bold',
                            color: '#10b981',
                            align: 'end'
                        }
                    ]
                },
                {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'md',
                    contents: [
                        {
                            type: 'text',
                            text: 'จำนวนรายการ',
                            size: 'sm',
                            color: '#999999',
                            flex: 1
                        },
                        {
                            type: 'text',
                            text: `${items.length} รายการ`,
                            size: 'sm',
                            color: '#999999',
                            align: 'end'
                        }
                    ]
                }
            ],
            paddingAll: '20px'
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: new Date().toLocaleString('th-TH'),
                    size: 'xs',
                    color: '#999999',
                    align: 'center'
                }
            ],
            paddingAll: '10px'
        }
    }
});

const createLowStockFlexMessage = (productName: string, currentStock: number, minStock: number, unit: string) => ({
    type: 'flex',
    altText: `⚠️ สินค้าใกล้หมด: ${productName}`,
    contents: {
        type: 'bubble',
        size: 'mega',
        header: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                        {
                            type: 'text',
                            text: '⚠️',
                            size: 'xxl',
                            flex: 0
                        },
                        {
                            type: 'text',
                            text: 'สินค้าใกล้หมด!',
                            color: '#ffffff',
                            size: 'xl',
                            weight: 'bold',
                            margin: 'md',
                            flex: 1
                        }
                    ],
                    alignItems: 'center'
                }
            ],
            backgroundColor: '#f59e0b',
            paddingAll: '20px'
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: productName,
                    weight: 'bold',
                    size: 'lg',
                    wrap: true
                },
                {
                    type: 'separator',
                    margin: 'lg'
                },
                {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'lg',
                    contents: [
                        {
                            type: 'text',
                            text: 'คงเหลือ',
                            size: 'md',
                            color: '#666666',
                            flex: 1
                        },
                        {
                            type: 'text',
                            text: `${currentStock} ${unit}`,
                            size: 'xl',
                            weight: 'bold',
                            color: '#ef4444',
                            align: 'end'
                        }
                    ]
                },
                {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'md',
                    contents: [
                        {
                            type: 'text',
                            text: 'จำนวนขั้นต่ำ',
                            size: 'sm',
                            color: '#999999',
                            flex: 1
                        },
                        {
                            type: 'text',
                            text: `${minStock} ${unit}`,
                            size: 'sm',
                            color: '#999999',
                            align: 'end'
                        }
                    ]
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'lg',
                    contents: [
                        {
                            type: 'text',
                            text: '📦 กรุณาเติมสต็อกโดยเร็ว',
                            size: 'sm',
                            color: '#f59e0b',
                            align: 'center'
                        }
                    ],
                    backgroundColor: '#fef3c7',
                    paddingAll: '10px',
                    cornerRadius: 'md'
                }
            ],
            paddingAll: '20px'
        }
    }
});

const createStockAdjustmentFlexMessage = (
    productName: string,
    previousQty: number,
    newQty: number,
    change: number,
    reason: string
) => ({
    type: 'flex',
    altText: `📦 ปรับสต็อก: ${productName}`,
    contents: {
        type: 'bubble',
        size: 'mega',
        header: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                        {
                            type: 'text',
                            text: '📦',
                            size: 'xxl',
                            flex: 0
                        },
                        {
                            type: 'text',
                            text: 'ปรับปรุงสต็อก',
                            color: '#ffffff',
                            size: 'xl',
                            weight: 'bold',
                            margin: 'md',
                            flex: 1
                        }
                    ],
                    alignItems: 'center'
                }
            ],
            backgroundColor: '#06b6d4',
            paddingAll: '20px'
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: productName,
                    weight: 'bold',
                    size: 'lg',
                    wrap: true
                },
                {
                    type: 'separator',
                    margin: 'lg'
                },
                {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'lg',
                    contents: [
                        {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'ก่อนหน้า',
                                    size: 'xs',
                                    color: '#999999',
                                    align: 'center'
                                },
                                {
                                    type: 'text',
                                    text: previousQty.toString(),
                                    size: 'xl',
                                    weight: 'bold',
                                    align: 'center'
                                }
                            ],
                            flex: 1
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: '→',
                                    size: 'xxl',
                                    align: 'center',
                                    color: '#999999'
                                }
                            ],
                            flex: 1,
                            justifyContent: 'center'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'ใหม่',
                                    size: 'xs',
                                    color: '#999999',
                                    align: 'center'
                                },
                                {
                                    type: 'text',
                                    text: newQty.toString(),
                                    size: 'xl',
                                    weight: 'bold',
                                    align: 'center',
                                    color: change > 0 ? '#10b981' : '#ef4444'
                                }
                            ],
                            flex: 1
                        }
                    ]
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'lg',
                    contents: [
                        {
                            type: 'text',
                            text: `${change > 0 ? '+' : ''}${change}`,
                            size: 'lg',
                            weight: 'bold',
                            align: 'center',
                            color: change > 0 ? '#10b981' : '#ef4444'
                        }
                    ],
                    backgroundColor: change > 0 ? '#d1fae5' : '#fee2e2',
                    paddingAll: '10px',
                    cornerRadius: 'md'
                },
                {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'lg',
                    contents: [
                        {
                            type: 'text',
                            text: 'เหตุผล:',
                            size: 'sm',
                            color: '#666666',
                            flex: 0
                        },
                        {
                            type: 'text',
                            text: reason || 'ไม่ระบุ',
                            size: 'sm',
                            color: '#666666',
                            margin: 'sm',
                            wrap: true,
                            flex: 1
                        }
                    ]
                }
            ],
            paddingAll: '20px'
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: new Date().toLocaleString('th-TH'),
                    size: 'xs',
                    color: '#999999',
                    align: 'center'
                }
            ],
            paddingAll: '10px'
        }
    }
});

const createDailySummaryFlexMessage = (
    totalSales: number,
    orderCount: number,
    profit: number,
    topProduct?: string
) => ({
    type: 'flex',
    altText: `📊 สรุปยอดขายวันนี้ ฿${totalSales.toLocaleString()}`,
    contents: {
        type: 'bubble',
        size: 'mega',
        header: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                        {
                            type: 'text',
                            text: '📊',
                            size: 'xxl',
                            flex: 0
                        },
                        {
                            type: 'text',
                            text: 'สรุปยอดขายวันนี้',
                            color: '#ffffff',
                            size: 'xl',
                            weight: 'bold',
                            margin: 'md',
                            flex: 1
                        }
                    ],
                    alignItems: 'center'
                }
            ],
            backgroundColor: '#3b82f6',
            paddingAll: '20px'
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: 'ยอดขายรวม',
                            size: 'sm',
                            color: '#666666',
                            align: 'center'
                        },
                        {
                            type: 'text',
                            text: `฿${totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                            size: 'xxl',
                            weight: 'bold',
                            color: '#10b981',
                            align: 'center',
                            margin: 'sm'
                        }
                    ],
                    backgroundColor: '#f0fdf4',
                    paddingAll: '15px',
                    cornerRadius: 'lg'
                },
                {
                    type: 'separator',
                    margin: 'lg'
                },
                {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'lg',
                    contents: [
                        {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: '🧾',
                                    size: 'xl',
                                    align: 'center'
                                },
                                {
                                    type: 'text',
                                    text: orderCount.toString(),
                                    size: 'lg',
                                    weight: 'bold',
                                    align: 'center'
                                },
                                {
                                    type: 'text',
                                    text: 'รายการ',
                                    size: 'xs',
                                    color: '#999999',
                                    align: 'center'
                                }
                            ],
                            flex: 1
                        },
                        {
                            type: 'separator'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: '💵',
                                    size: 'xl',
                                    align: 'center'
                                },
                                {
                                    type: 'text',
                                    text: `฿${profit.toLocaleString()}`,
                                    size: 'lg',
                                    weight: 'bold',
                                    align: 'center',
                                    color: '#10b981'
                                },
                                {
                                    type: 'text',
                                    text: 'กำไร',
                                    size: 'xs',
                                    color: '#999999',
                                    align: 'center'
                                }
                            ],
                            flex: 1
                        }
                    ]
                },
                ...(topProduct ? [
                    {
                        type: 'box' as const,
                        layout: 'vertical' as const,
                        margin: 'lg' as const,
                        contents: [
                            {
                                type: 'text' as const,
                                text: `🏆 สินค้าขายดี: ${topProduct}`,
                                size: 'sm' as const,
                                color: '#8b5cf6',
                                align: 'center' as const
                            }
                        ],
                        backgroundColor: '#f5f3ff',
                        paddingAll: '10px',
                        cornerRadius: 'md' as const
                    }
                ] : [])
            ],
            paddingAll: '20px'
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: new Date().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    size: 'xs',
                    color: '#999999',
                    align: 'center'
                }
            ],
            paddingAll: '10px'
        }
    }
});

export class SmsService {
    async sendSms(to: string[], body: string, tenantPrisma: PrismaClient) {
        try {
            const settings = await getSettingValue('sms', tenantPrisma);

            if (!settings.enabled) {
                console.log('ℹ️ SMS disabled, skipping:', body);
                return;
            }

            const provider = settings.provider as string;
            if (provider === 'line') {
                await this.sendLineText(to as string[], body);
            } else if (provider === 'twilio') {
                await this.sendTwilio(to as string[], body, settings);
            } else {
                console.log('⚠️ Unknown SMS provider:', settings.provider);
            }
        } catch (error) {
            console.error('❌ Error in SmsService:', error);
        }
    }

    async sendAlert(type: keyof typeof DEFAULT_SETTINGS.sms.alerts, body: string, tenantPrisma: PrismaClient, flexData?: any) {
        try {
            const settings = await getSettingValue('sms', tenantPrisma);
            if (!settings.enabled || !(settings.alerts as any)[type]) {
                return;
            }
            const recipients = settings.recipients as unknown as string[];

            // Use Flex Message if data provided, otherwise use text
            if (flexData) {
                await this.sendLineFlex(recipients, flexData);
            } else {
                await this.sendLineText(recipients, body);
            }
        } catch (error) {
            console.error('❌ Error sending alert:', error);
        }
    }

    // Send Flex Message for sales with item details
    async sendSalesAlert(saleNumber: string, total: number, items: SaleItem[], tenantPrisma: PrismaClient) {
        try {
            const settings = await getSettingValue('sms', tenantPrisma);
            if (!settings.enabled || !(settings.alerts as any).realtimeSales) {
                return;
            }
            const recipients = settings.recipients as unknown as string[];
            const flexMessage = createSalesFlexMessage(saleNumber, total, items);
            await this.sendLineFlex(recipients, flexMessage);
        } catch (error) {
            console.error('❌ Error sending sales alert:', error);
        }
    }

    // Send Flex Message for low stock
    async sendLowStockAlert(productName: string, currentStock: number, minStock: number, unit: string, tenantPrisma: PrismaClient) {
        try {
            const settings = await getSettingValue('sms', tenantPrisma);
            if (!settings.enabled || !(settings.alerts as any).lowStock) {
                return;
            }
            const recipients = settings.recipients as unknown as string[];
            const flexMessage = createLowStockFlexMessage(productName, currentStock, minStock, unit);
            await this.sendLineFlex(recipients, flexMessage);
        } catch (error) {
            console.error('❌ Error sending low stock alert:', error);
        }
    }

    // Send Flex Message for stock adjustment
    async sendStockAdjustmentAlert(
        productName: string,
        previousQty: number,
        newQty: number,
        reason: string,
        tenantPrisma: PrismaClient
    ) {
        try {
            const settings = await getSettingValue('sms', tenantPrisma);
            if (!settings.enabled || !(settings.alerts as any).stockAdjustments) {
                return;
            }
            const recipients = settings.recipients as unknown as string[];
            const change = newQty - previousQty;
            const flexMessage = createStockAdjustmentFlexMessage(productName, previousQty, newQty, change, reason);
            await this.sendLineFlex(recipients, flexMessage);
        } catch (error) {
            console.error('❌ Error sending stock adjustment alert:', error);
        }
    }

    // Send Flex Message for daily summary
    async sendDailySummaryAlert(
        totalSales: number,
        orderCount: number,
        profit: number,
        topProduct: string | undefined,
        tenantPrisma: PrismaClient
    ) {
        try {
            const settings = await getSettingValue('sms', tenantPrisma);
            if (!settings.enabled || !(settings.alerts as any).dailySummary) {
                return;
            }
            const recipients = settings.recipients as unknown as string[];
            const flexMessage = createDailySummaryFlexMessage(totalSales, orderCount, profit, topProduct);
            await this.sendLineFlex(recipients, flexMessage);
        } catch (error) {
            console.error('❌ Error sending daily summary alert:', error);
        }
    }

    private async sendLineText(to: string[], body: string) {
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            console.error('❌ LINE Channel Access Token missing in .env');
            return;
        }

        console.log(`📨 Sending LINE text to ${to.length} recipients...`);

        for (const recipient of to) {
            try {
                const response = await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        to: recipient.trim(),
                        messages: [{ type: 'text', text: body }]
                    })
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error(`❌ LINE Failed to ${recipient}:`, err);
                } else {
                    console.log(`✅ LINE Text Sent to ${recipient}`);
                }
            } catch (e) {
                console.error(`❌ Network error sending LINE to ${recipient}`, e);
            }
        }
    }

    private async sendLineFlex(to: string[], flexMessage: any) {
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            console.error('❌ LINE Channel Access Token missing in .env');
            return;
        }

        console.log(`📨 Sending LINE Flex Message to ${to.length} recipients...`);

        for (const recipient of to) {
            try {
                const response = await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        to: recipient.trim(),
                        messages: [flexMessage]
                    })
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error(`❌ LINE Flex Failed to ${recipient}:`, err);
                } else {
                    console.log(`✅ LINE Flex Sent to ${recipient}`);
                }
            } catch (e) {
                console.error(`❌ Network error sending LINE Flex to ${recipient}`, e);
            }
        }
    }

    private async sendTwilio(to: string[], body: string, settings: any) {
        if (!settings.apiKey) {
            console.error('❌ Twilio API Key missing');
            return;
        }

        const [sid, token] = settings.apiKey.split(':');
        if (!sid || !token) {
            console.error('❌ Invalid Twilio API Key format. Expected SID:Token');
            return;
        }

        const sender = settings.sender || '';

        console.log(`📨 Sending SMS to ${to.length} recipients...`);

        for (const recipient of to) {
            let phone = recipient.replace(/-/g, '').replace(/\s/g, '').trim();
            if (phone.startsWith('0')) {
                phone = '+66' + phone.substring(1);
            }

            try {
                const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
                const formData = new URLSearchParams();
                formData.append('To', phone);
                if (sender) {
                    formData.append('From', sender);
                } else {
                    formData.append('From', '+15005550006');
                    formData.delete('From');
                }
                formData.append('Body', body);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + Buffer.from(sid + ':' + token).toString('base64'),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error(`❌ SMS Failed to ${phone}:`, err);
                } else {
                    console.log(`✅ SMS Sent to ${phone}`);
                }
            } catch (e) {
                console.error(`❌ Network error sending SMS to ${phone}`, e);
            }
        }
    }
}

export const smsService = new SmsService();
