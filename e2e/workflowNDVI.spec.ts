import { test, expect } from 'playwright/test';

/*
await page.evaluate(() => {
  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.width = '10px';
  dot.style.height = '10px';
  dot.style.background = 'red';
  dot.style.borderRadius = '50%';
  dot.style.left = `${viewport.width/2}px`;
  dot.style.top = `${viewport.height*2/3}px`;
  dot.style.zIndex = '9999';
  document.body.appendChild(dot);
});

const viewport = page.viewportSize();
console.log('Viewport size:', viewport);

await page.screenshot({ path: 'click-position.png' });

*/

test("NDVI workflow", async ({ page }) => {
  const viewport = {
    width: 1920,
    height: 1080
  }
  test.setTimeout(120000); // 2 minutes
  await page.setViewportSize({width: viewport.width, height: viewport.height})
  
  const params = new URLSearchParams({
    startdate: '2025-06-01T00:00:00',
    enddate: '2025-12-31T00:00:00',
  });
  await page.goto(`/?${params.toString()}`);

  await page.waitForSelector('[data-testid="map-container"] canvas', { state: 'visible' })
  //await page.screenshot({ path: 'map-ready.png' });

  await page.click('[data-testid="draw-point-roi"]');
  await page.mouse.click(viewport.width*2/3, viewport.height*2/3);
  await page.click('[data-testid="compute-ndvi"]');
  await page.waitForSelector('[data-testid="main-loading"]', {
      state: 'hidden',
  });
  //await page.screenshot({ path: 'chart-ready.png' });

  await page.getByTestId("chart-area").click({position:{ x: 150, y:100}})
  const textarea = page.getByTestId('chart-textarea');
  await expect(textarea).toBeVisible();
  await expect(textarea).toBeEditable();
  await textarea.fill('Simple Annotation');
  //await page.screenshot({ path: 'textarea-1-ready.png' });
  
  await page.press('[data-testid="chart-textarea"]', "Escape")
  const label = page.getByTestId('chart-label-2');
  await expect(label).toBeVisible();
  //await page.screenshot({ path: 'label-1-ready.png' });

  await page.getByTestId("chart-area").click({position:{ x: 500, y:100}})
  const textarea2 = page.getByTestId('chart-textarea');
  await expect(textarea2).toBeVisible();
  await expect(textarea2).toBeEditable();
  await textarea2.fill('Simple Annotation 2');
  //await page.screenshot({ path: 'textarea-2-ready.png' });
  
  await page.press('[data-testid="chart-textarea"]', "Escape")
  const label2 = page.getByTestId('chart-label-10');
  await expect(label2).toBeVisible();
  //await page.screenshot({ path: 'label-2-ready.png' });

  await page.getByTestId("change-point").click()
  const changePointWindow = page.getByTestId("change-point-window");
  await expect(changePointWindow).toBeVisible();
  await changePointWindow.fill('3');
  await page.getByTestId("change-point").click()
  //await page.screenshot({ path: 'change-point-ready.png' });

  const [downloadCSV] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="export-csv"]'),
  ]);
  expect(downloadCSV).toBeTruthy();
  const fileNameCSV = downloadCSV.suggestedFilename();
  expect(fileNameCSV).toMatch(/\.csv$/);
  await downloadCSV.saveAs(
    `./test-artifacts/${downloadCSV.suggestedFilename()}`
  );

  const [downloadPNG] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="export-png"]'),
  ]);
  expect(downloadPNG).toBeTruthy();
  const fileNamePNG = downloadPNG.suggestedFilename();
  expect(fileNamePNG).toMatch(/\.png$/);
  await downloadPNG.saveAs(
    `./test-artifacts/${downloadPNG.suggestedFilename()}`
  );
});

