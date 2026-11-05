/**
 * SILLYGER Notifications Dispatcher
 * Handles: Official WhatsApp Group links, Direct WhatsApp Notifications, and Beem SMS.
 */

export interface WhatsAppNotification {
  toPhone: string;
  template: 'WELCOME_APPROVAL' | 'TV_LIVE_NOW' | 'NEW_ANNOUNCEMENT' | 'SECURITY_ALERT';
  params: Record<string, string>;
}

export class SillygerNotificationService {
  private whatsappToken: string;
  private whatsappPhoneId: string;

  constructor() {
    this.whatsappToken = process.env.WHATSAPP_CLOUD_TOKEN || '';
    this.whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  /**
   * Dispatches WhatsApp template message or fallback direct invite
   */
  async sendWhatsAppAlert(alert: WhatsAppNotification): Promise<boolean> {
    console.log(`[WHATSAPP] Inatuma taarifa ya ${alert.template} kwenda ${alert.toPhone}`);

    if (!this.whatsappToken) {
      console.log(`[WHATSAPP MOCK] Token haijawekwa kwenye .env; taarifa imerekodiwa kwa majaribio.`);
      return true;
    }

    // Call Meta WhatsApp Business Cloud API
    try {
      const url = `https://graph.facebook.com/v19.0/${this.whatsappPhoneId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: alert.toPhone,
          type: 'text',
          text: { body: `[SILLYGER] Taarifa Rasmi: ${JSON.stringify(alert.params)}` },
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('[WHATSAPP ERROR]', err);
      return false;
    }
  }
}
