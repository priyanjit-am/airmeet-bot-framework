const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const { chromium } = require('playwright');

const TIMEOUT = 12000;
const USER_COUNT = 5;

const asyncSleep = (timeout: number = 500) => new Promise(resolve => setTimeout(resolve, timeout ));
const logger = (...args: any[]) => {
    const d = new Date();
    console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()}`, ...args);
};

const run = async (userId: number) => {
    const infoLog = (...args: any[]) => {
        const d = new Date();
        console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()}`, `Bot-${userId} Info: `, ...args);
    };

    const browser = await chromium.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        defaultViewport: {
            width: 1200,
            height: 800
        },
        args: [
            `--ignore-https-errors`,
            `--ignore-certificate-errors`,
            `--disable-gl-drawing-for-tests`,
            `--use-fake-device-for-media-stream`,
            `--use-fake-ui-for-media-stream`,
            `--no-sandbox`,
            `--use-file-for-fake-video-capture=/Users/priyanjitdey/Documents/work/airmeet/table-bot-test/dist/test.Y4M`,
            `--use-file-for-fake-audio-capture=/Users/priyanjitdey/Documents/work/airmeet/table-bot-test/dist/test.wav`,
        ]
    });

    infoLog('Browser launched');

    const context = await browser.newContext({
        permissions: ['camera', 'microphone']
    });
    const page = await context.newPage();
    infoLog('Page created');

    await page.goto('https://localhost:5000/e/29dd07e0-c3bd-11ed-b056-37ab5c81871a');
    await page.waitForLoadState('domcontentloaded');

    let pageTitle = await page.title();
    infoLog('Page loaded', `Title - ${pageTitle}`);

    await page.locator('#event-details-header').getByRole('button', { name: 'Enter event' }).click();
    infoLog('Click Enter Event')

    const firstNameLocator = page.locator('[id="03067638-d058-4d06-bfe7-59ae176e03a5"]');
    await firstNameLocator.waitFor();
    firstNameLocator.fill(`botUser-fn-${userId}`);

    const lastNameLocator = page.locator('[id="180b03ad-e47b-44cc-bfab-4375d598afeb"]');
    await lastNameLocator.waitFor();
    lastNameLocator.fill(`botUser-ln-${userId}`);

    infoLog('Name is typed');

    await page.getByRole('button', { name: 'Enter' }).click();
    infoLog('Started event entry');

    await page.getByRole('button', { name: 'Lounge' }).click();
    infoLog('Entered event. Clicked on lounge menu item');

    await page.getByLabel('Join Table 2').click();
    infoLog('Joining table');

    // await page.waitForSelector(".sc-fzqAbL", { timeout: 0 });

    // let enterBtns = await page.$$(".sc-fzqAbL");
    // await enterBtns[1].click();
    // infoLog('Clicked login btn');

    // await page.waitForSelector('[id="03067638-d058-4d06-bfe7-59ae176e03a5"]', { timeout: 120 * 1000 });
    // await page.type('[id="03067638-d058-4d06-bfe7-59ae176e03a5"]', `botUser-fn-${userId}`);
    // await page.type('[id="180b03ad-e47b-44cc-bfab-4375d598afeb"]', `botUser-ln-${userId}`);
    // infoLog('Name is typed');

    // enterBtns = await page.$$(".sc-fzqAbL");
    // await enterBtns[3].click();
    // infoLog('Clicked on Enter event button');

    // await page.waitForSelector('.cldAxK', { timeout: 0 });
    // infoLog('Landed in reception');

    // const loungeListItem = await page.$('.cldAxK');
    // const loungeBtn = await loungeListItem?.$('button');
    // if (loungeBtn) {
    //     await loungeBtn.click();
    //     infoLog('Clicked on lounge button in reception');
    // } else {
    //     infoLog('loungeBtn in reception not found');
    // }

    // await page.waitForSelector('#table2', { timeout: 0 });
    // infoLog('Landed in lounge, table 2 found');

    // const table = await page.$('#table2');
    // if (table) {
    //     await table.waitForSelector('.sc-kOfXQG.ZyLSK', { timeout: 0 });
    //     infoLog('Chairs are rendered');
    //     const chairBtn = await table.$('.sc-kOfXQG.ZyLSK');
    //     if (chairBtn) {
    //         await chairBtn.click();
    //         infoLog('Clicked on chair btn');
    //     } else {
    //         infoLog('Chair btn not found');
    //     }
    // } else {
    //     infoLog('Table not found');
    // }

    // await browser.close();
};

const driver = async (botCount = 20) => {
    for (let i = 0; i < botCount; i++) {
        console.log(`Spawning bot ${i}`);
        await run(i);
    }
};


const PORT = process.env.PORT || 9123;
const app = express();
app.listen(PORT, () => {
    logger(`Server is running at port ${PORT}`);
});