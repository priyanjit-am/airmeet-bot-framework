import puppeteer from 'puppeteer';

const TIMEOUT = 12000;
const USER_COUNT = 5;

const run = async (userId: number) => {
    const infoLog = (...args: any[]) => {
        const d = new Date();
        console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`, `Bot-${userId} Info: `, ...args);
    };
    const browser = await puppeteer.launch({
        headless: 'new',
        ignoreHTTPSErrors: true,
        defaultViewport: {
            width: 1200,
            height: 800
        },
        args: [
            `--disable-gl-drawing-for-tests`,
            `--no-sandbox`
        ]
    });
    infoLog('Browser launched');
    const page = await browser.newPage();
    infoLog('Page created');

    page.goto('https://master.test.airmeet.com/e/29dd07e0-c3bd-11ed-b056-37ab5c81871a', {
        timeout: 0,
        waitUntil: 'domcontentloaded'
    });
    let pageTitle = await page.title();
    infoLog('Page loaded', `Title - ${pageTitle}`);

    await page.waitForSelector(".sc-fzoxKX", { timeout: 0 });

    let enterBtns = await page.$$(".sc-fzoxKX");
    await enterBtns[1].click();
    infoLog('Clicked login btn');

    await page.waitForSelector('[id="03067638-d058-4d06-bfe7-59ae176e03a5"]', { timeout: 120 * 1000 });
    await page.type('[id="03067638-d058-4d06-bfe7-59ae176e03a5"]', `botUser-fn-${userId}`);
    await page.type('[id="180b03ad-e47b-44cc-bfab-4375d598afeb"]', `botUser-ln-${userId}`);
    infoLog('Name is typed');
    
    enterBtns = await page.$$(".sc-fzoxKX");
    await enterBtns[3].click();
    infoLog('Clicked on Enter event button');

    await page.waitForSelector('.cldAxK', { timeout: 0 });
    infoLog('Landed in reception');

    const loungeListItem = await page.$('.cldAxK');
    const loungeBtn = await loungeListItem?.$('button');
    if (loungeBtn) {
        await loungeBtn.click();
        infoLog('Clicked on lounge button in reception');
    } else {
        infoLog('loungeBtn in reception not found');
    }

    await page.waitForSelector('#table2', { timeout: 0 });
    infoLog('landed in lounge, table 2 found');

    const table = await page.$('#table2');
    if (table) {
        await table.waitForSelector('.sc-kOfXQG.ZyLSK', { timeout: 0 });
        infoLog('chairs are rendered');
        const chairBtn = await table.$('.sc-kOfXQG.ZyLSK');
        if (chairBtn) {
            await chairBtn.click();
            infoLog('clicked on chair btn');
        } else {
            infoLog('chair btn not found');
        }
    } else {
        infoLog('Table not found');
    }
};

run(1);
