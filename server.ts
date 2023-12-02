import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
const cors = require('cors');

import { Page, chromium } from 'playwright';
import { expect } from '@playwright/test';

interface IBot {
    id: number;
    page: any;
    browser: any;
}
interface IBotStore {
    [url: string] : {
        bots: IBot[]
    }
}
const botStore: IBotStore = {};

console.log('Fake video path - ', process.env.FAKE_VIDEO_PATH);
console.log('Fake audio path - ', process.env.FAKE_AUDIO_PATH);

// const asyncSleep = (timeout: number = 500) => new Promise(resolve => setTimeout(resolve, timeout ));
const logger = (...args: any[]) => {
    const d = new Date();
    console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()}`, ...args);
};

const joinTable = async (url: string, userId: number) => {
    const infoLog = (...args: any[]) => {
        const d = new Date();
        console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()}`, `Bot-${userId} Info: `, ...args);
    };

    const browser = await chromium.launch({
        headless: true,
        args: [
            `--ignore-https-errors`,
            `--ignore-certificate-errors`,
            // `--disable-gl-drawing-for-tests`,
            `--use-fake-device-for-media-stream`,
            `--use-fake-ui-for-media-stream`,
            `--no-sandbox`,
            `--use-file-for-fake-video-capture=${process.env.FAKE_VIDEO_PATH}`,
            `--use-file-for-fake-audio-capture=${process.env.FAKE_AUDIO_PATH}`,
        ]
    });

    infoLog('Browser launched');

    const context = await browser.newContext({
        permissions: ['camera', 'microphone'],
        screen: {
            width: 1200,
            height: 800
        }
    });
    const page = await context.newPage();
    infoLog('Page created');

    botStore[url].bots.push({
        id: userId,
        browser,
        page
    })

    await page.goto(url);
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

    const middleFooterLocator = page.locator('.middle-footer');
    await middleFooterLocator.waitFor();
    const videoBtn = middleFooterLocator.getByRole('button').nth(0);
    const audioBtn = middleFooterLocator.getByRole('button').nth(1);
    infoLog('Joined table');

    const isVideoDisabled = await videoBtn.isDisabled();
    const isAudioDisabled = await audioBtn.isDisabled();
    infoLog(`A/V status. Audio - ${isAudioDisabled}, Video - ${isVideoDisabled}`);
};
const leaveTable = async (url: string, userId: number) => {
    const infoLog = (...args: any[]) => {
        const d = new Date();
        console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()}`, `Bot-${userId} Info: `, ...args);
    };

    const bot = botStore[url]?.bots?.find(b => b.id == userId);
    if (!bot?.page) {
        throw new Error(`Kill: Cannot find page instance of ${userId} in ${url}`);
    }

    const { browser, page } = bot;

    if (page) {
        const isExitButtonVisible = await page.getByLabel('Exit table').isVisible();
        if (isExitButtonVisible) {
            await page.getByLabel('Exit table').click();
            infoLog('Exit table clicked');
        }

        // await asyncSleep(1500);
        const tableModalLocator = await page.locator('.join-table-wapper');
        await expect(tableModalLocator).toHaveCount(0);
        infoLog('Table closed');

        await page.close();
        infoLog('Page closed');
    }

    if (browser) {
        await browser.close();
        infoLog('Browser closed');
    }

    return true;
}

const toggleMedia = async (url: string, userId: number, media: 'audio' | 'video') => {
    const infoLog = (...args: any[]) => {
        const d = new Date();
        console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()}`, `Bot-${userId} Info: `, ...args);
    };

    const bot = botStore[url]?.bots?.find(b => b.id == userId);
    if (!bot?.page) {
        throw new Error(`Toggle-Media: Cannot find page instance of ${userId} in ${url}`);
    };

    const page: Page = bot.page;
    let ans: any = {};

    if (page) {
        const middleFooterLocator = page.locator('.middle-footer');
        await middleFooterLocator.waitFor();
        const videoBtn = middleFooterLocator.getByRole('button').nth(0);
        const audioBtn = middleFooterLocator.getByRole('button').nth(1);

        if (media === 'audio' || !media) {
            const isAudioVisible = await audioBtn.isVisible();
            const isAudioDisabled = await audioBtn.isDisabled();

            if (isAudioVisible && !isAudioDisabled) {
                await audioBtn.click();
                infoLog('toggle audio');
                ans.audio = true;
            }
        }

        if (media === 'video' || !media) {
            const isVideoVisible = await videoBtn.isVisible();
            const isVideoDisabled = await videoBtn.isDisabled();

            if (isVideoVisible && !isVideoDisabled) {
                await videoBtn.click();
                infoLog('toggle video');
                ans.video = true;
            }
        }
    }

    return ans;
}
// const driver = async (botCount = 20) => {
//     for (let i = 0; i < botCount; i++) {
//         console.log(`Spawning bot ${i}`);
//         await joinTable('https://localhost:5000/e/29dd07e0-c3bd-11ed-b056-37ab5c81871a', i);
//     }
// };
// driver(1);


interface ISpawnReq {
    url: string;
    botCount: number;    
}

const PORT = process.env.PORT || 6020;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.post('/spawn', async (req: any, res: any) => {
    const spawnedIds: number[] = [];
    const reqBody: ISpawnReq = req.body;
    const { botCount, url } = reqBody;

    botStore[url] = botStore[url] || {
        bots: []
    };
    let curBotCount = botStore[url]?.bots.length;
    console.log(`Current bot count - ${curBotCount}. Spawning ${botCount} bots in url - ${url}`);

    res.status(200).json({
        msg: 'triggered bot spawn'
    });

    for (let i = 0; i < botCount; i++) {
        try {
            await joinTable(url, curBotCount);
            spawnedIds.push(curBotCount);
            console.log('Spawned bot - ', curBotCount);
        } catch(err) {
            console.log('Error while spawning bot - ', curBotCount, err?.toString());
        }
        curBotCount++;
    }
});

app.get('/info', async (req, res) => {
    const { url } = req.body;
    res.status(200).json({
        url,
        botCount: botStore[url]?.bots?.length || 0
    });
})

app.post('/kill', async (req: any, res: any) => {
    console.log('In kill');
    const { url } = req.body;

    const botLength = botStore[url]?.bots?.length;
    const ans: any = {
        [url]: {}
    }
    if (botLength) {
        for (let i = 0; i < botLength; i++) {
            const bot = botStore[url].bots[i];
            try {
                await leaveTable(url, bot.id);
                ans[url][bot.id] = true;
                console.log(`Killed bot - ${bot.id} in url - ${url}`, );
            } catch(err) {
                ans[url][bot.id] = false;
                console.log('Error while killing bot - ', bot.id, err?.toString());
            }
        }

        delete botStore[url];
    }
    res.status(200).json({
        msg: `Killed ${botLength} bots`,
        status: ans
    });
});

app.post('/toggle-media', async (req, res) => {
    const { url, id, mediaType } = req.body;

    let ans: any = {
        [url]: {}
    };
    try {
        ans[url] = await toggleMedia(url, id, mediaType);
    } catch(err) {
        ans[url] = { error: `failed to toggle - ${err?.toString()}` };
    }

    res.status(200).json({
        status: ans
    });
})


app.listen(PORT, () => {
    logger(`Server is running at port ${PORT}`);
});