/**
 * Server ishga tushganda bir marta bajariladi.
 * ENABLE_BOT=true bo'lsa, Telegram bot jarayonini shu yerda ishga tushiramiz.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.ENABLE_BOT !== 'true') return;

  try {
    const { startBot } = await import('./lib/scheduler');
    startBot();
  } catch (e) {
    console.error('[bot] Ishga tushirib bo‘lmadi:', e);
  }
}
