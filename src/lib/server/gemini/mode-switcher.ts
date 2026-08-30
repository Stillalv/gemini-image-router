import type { Page } from 'playwright';

export async function applyGeminiModel(page: Page, modelId?: string): Promise<void> {
  if (!modelId) return;

  const modeTargetMap: Record<string, string> = {
    '3.5-flash-lite': 'Flash-Lite',
    '3.7-flash': 'Flash',
    '3.1-pro': 'Pro',
    'extended-thinking': 'Extended thinking'
  };

  const targetText = modeTargetMap[modelId];
  if (!targetText) return;

  try {
    const modeBtn = page.locator('button.input-area-switch, [aria-label*="mode picker" i]').first();
    if (await modeBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      const currentText = await modeBtn.innerText().catch(() => '');
      // If already in target mode, no need to switch
      if (currentText.toLowerCase().includes(targetText.toLowerCase())) {
        return;
      }

      await modeBtn.click();
      await page.waitForTimeout(600);

      const targetOption = page.locator(`[role="menuitem"]:has-text("${targetText}"), .mat-mdc-menu-item:has-text("${targetText}")`).first();
      if (await targetOption.count() && (await targetOption.isVisible())) {
        await targetOption.click();
        await page.waitForTimeout(800);
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
    }
  } catch (err: any) {
    console.warn(`[MODE] Could not switch to model ${modelId}:`, err.message);
  }
}
