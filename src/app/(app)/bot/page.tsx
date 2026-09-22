import { requireAdmin } from '@/lib/auth';
import { isConfigured, loadSettings, maskedToken } from '@/lib/telegram';
import { dmy } from '@/lib/format';
import BotSettingsForm from './BotSettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bot sozlamalari' };

export default async function BotPage() {
  await requireAdmin();
  const s = await loadSettings();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bot sozlamalari</h1>
          <p>Telegram orqali kunlik va haftalik hisobotlar</p>
        </div>
        <div className="actions">
          {isConfigured(s) ? (
            <span className="badge ok">Sozlangan</span>
          ) : (
            <span className="badge warn">Token yoki Chat ID kiritilmagan</span>
          )}
        </div>
      </div>

      <BotSettingsForm
        s={{
          hasToken: !!s.token,
          maskedToken: maskedToken(s.token),
          chatIds: s.chatIds,
          dailyEnabled: s.dailyEnabled,
          dailyTime: s.dailyTime,
          weeklyEnabled: s.weeklyEnabled,
          weeklyDay: s.weeklyDay,
          notifyPayments: s.notifyPayments,
          notifyNew: s.notifyNew,
          notifyClosed: s.notifyClosed,
          commandsEnabled: s.commandsEnabled,
          lastDailySent: s.lastDailySent ? dmy(s.lastDailySent) : '',
          lastWeeklySent: s.lastWeeklySent ? dmy(s.lastWeeklySent) : '',
        }}
      />
    </>
  );
}
