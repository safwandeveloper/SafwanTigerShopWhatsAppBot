import { config } from '../src/config.js';
import { COMMANDS } from '../src/menu.js';

async function main(): Promise<void> {
  if (!config.accessToken || !config.phoneNumberId) {
    console.error(
      'WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required to set up commands',
    );
    process.exitCode = 1;
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/conversational_automation`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enable_welcome_message: true,
        commands: COMMANDS,
        prompts: ['Show me products', 'How do I top up?', 'I need support'],
      }),
    },
  );
  const responseBody = (await response.text()).slice(0, 1_000);

  console.log(`HTTP ${response.status}`);
  console.log(responseBody);
  if (!response.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error('WhatsApp command setup failed', error);
  process.exitCode = 1;
});
