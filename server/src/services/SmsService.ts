import { PrismaClient } from '@prisma/client';
import { getSettingValue, DEFAULT_SETTINGS } from '../utils/helpers';

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
                await this.sendLine(to as string[], body);
            } else if (provider === 'twilio') {
                await this.sendTwilio(to as string[], body, settings);
            } else {
                console.log('⚠️ Unknown SMS provider:', settings.provider);
            }
        } catch (error) {
            console.error('❌ Error in SmsService:', error);
        }
    }

    async sendAlert(type: keyof typeof DEFAULT_SETTINGS.sms.alerts, body: string, tenantPrisma: PrismaClient) {
        try {
            const settings = await getSettingValue('sms', tenantPrisma);
            if (!settings.enabled || !(settings.alerts as any)[type]) {
                return;
            }
            // Use configured recipients
            await this.sendLine(settings.recipients as unknown as string[], body);
        } catch (error) {
            console.error('❌ Error sending alert:', error);
        }
    }

    private async sendLine(to: string[], body: string) {
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            console.error('❌ LINE Channel Access Token missing in .env');
            return;
        }

        console.log(`📨 Sending LINE message to ${to.length} recipients...`);

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
                    console.log(`✅ LINE Sent to ${recipient}`);
                }
            } catch (e) {
                console.error(`❌ Network error sending LINE to ${recipient}`, e);
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
            // Basic formatting for Thai numbers
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
                    // Twilio requires a 'From' number. If not provided, it will fail unless a default is set in Twilio console? 
                    // Usually you need a specific number. 
                    // We'll try to send without, or warn user.
                    formData.append('From', '+15005550006'); // Magic number for testing? No, users need their own.
                    // Better: Don't append if empty, let Twilio error out if required.
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
