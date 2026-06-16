/**
 * OpenCode → Hermes Gateway Webhook Plugin
 * 
 * Captures session info (title), accumulates AI reply text,
 * sends formatted card-style notifications to Feishu via Hermes webhook.
 */
import type { Plugin } from '@opencode-ai/plugin';

const WEBHOOK_URL = 'http://127.0.0.1:8644/webhooks/opencode-events';

const SEND_EVENTS = new Set([
  'session.idle', 'session.error',
  'permission.updated', 'permission.replied',
]);

const replyText  = new Map<string, string>();  // sessionID → accumulated reply
const sessionName = new Map<string, string>();  // sessionID → human-readable title

function sid(event: any): string {
  return event.properties?.sessionID
    || event.properties?.info?.id
    || event.sessionID || '?';
}

function sname(s: string): string {
  return sessionName.get(s) || s.substring(0, 12);
}

function eventTitle(et: string): string {
  switch (et) {
    case 'session.idle':          return '🟢 任务完成';
    case 'session.error':         return '🔴 执行失败';
    case 'permission.updated':    return '🟡 权限请求';
    case 'permission.replied':    return '🔵 权限已响应';
    default: return et;
  }
}

async function notify(event: any) {
  const et = event.type || 'unknown';

  // Capture session title from session.created / updated
  if (et === 'session.created' || et === 'session.updated') {
    const info = event.properties?.info;
    if (info?.id && info?.title) {
      sessionName.set(info.id, info.title);
    }
  }

  // Accumulate streaming reply
  if (et === 'message.part.updated') {
    const part = event.properties?.part;
    const delta = event.properties?.delta;
    if (part?.type === 'text' && !part?.synthetic) {
      const s = part.sessionID || sid(event);
      const txt = delta || part.text || '';
      if (txt) replyText.set(s, (replyText.get(s) || '') + txt);
    }
    return;
  }

  if (et === 'session.deleted') {
    const s = sid(event);
    replyText.delete(s); sessionName.delete(s);
    return;
  }

  if (!SEND_EVENTS.has(et)) return;

  const s = sid(event);
  const body: Record<string, any> = {
    event_type: et, eventType: et,
    sessionId: s, sessionName: sname(s),
    timestamp: new Date().toISOString(),
    title: eventTitle(et),
  };

  if (et === 'session.error') {
    const err = event.properties?.error;
    body.summary = err?.data?.message || err?.name || String(err || '');
  } else if (et === 'session.idle') {
    body.summary = replyText.get(s) || '(no output)';
    replyText.delete(s);
  } else if (et === 'permission.updated') {
    const p = event.properties || {};
    body.summary = `${p.title || p.type || '?'} (${p.id || ''})`;
  } else if (et === 'permission.replied') {
    const p = event.properties || {};
    body.summary = `${p.response || '?'} → ${p.permissionID || '?'}`;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_) {}
}

const HermesNativeWebhook: Plugin = async (_input) => {
  return { event: async ({ event }: any) => { await notify(event); } };
};
export default HermesNativeWebhook;
