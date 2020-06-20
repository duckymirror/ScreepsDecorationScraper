import bent from 'bent';
import got from 'got';
import fs from 'fs';
import { isFloorLandscapeDecoration, isWallLandscapeDecoration, isWallGraffitiDecoration } from './decorationsAPIHelper';

const getString = bent('string');

async function sleep(ms: number) {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

interface DecorationSummary {
    id: string;
    url: string | undefined;
    type: DecorationType;
    rarity: number;
}

async function getDecoration(room: string, shard: string): Promise<{
    decorations: DecorationSummary[];
    rateLimitHit: boolean;
}> {
    try {
        const response = await got(`https://screeps.com/api/game/room-decorations?room=${room}&shard=${shard}`);
        const decorations: Decorations = JSON.parse(response.body);
        return {
            decorations: decorations.decorations.map((d) => {
                let url: string | undefined;
                if (isFloorLandscapeDecoration(d.decoration)) {
                    url = d.decoration.floorForegroundUrl;
                } else if (isWallLandscapeDecoration(d.decoration)) {
                    url = d.decoration.foregroundUrl;
                } else if (isWallGraffitiDecoration(d.decoration)) {
                    url = d.decoration.graphics[0].url;
                }
                return {
                    /* eslint no-underscore-dangle: ["error", { "allow": ["_id"]}] */
                    id: d.decoration._id,
                    url,
                    type: d.decoration.type,
                    rarity: d.decoration.rarity,
                };
            }),
            rateLimitHit: false,
        };
    } catch (e) {
        if (e instanceof got.HTTPError) {
            if (e.response.statusCode === 429) {
                console.log('Rate limit hit. Retrying in 3 seconds.');
                return new Promise((resolve) => {
                    setTimeout(async () => resolve({
                        ...await getDecoration(room, shard),
                        rateLimitHit: true,
                    }), 3000);
                });
            }
        }
        throw new Error(`Unexpected error: ${e}`);
    }
}

async function runScrape(shard: string) {
    const json = await getString(`https://www.leagueofautomatednations.com/map/${shard}/rooms.js`);
    const data: LOANRooms = JSON.parse(json);
    const rooms: LOANRooms = {};
    for (const room of Object.keys(data)) {
        if (data[room].level > 0) {
            rooms[room] = data[room];
        }
    }
    const roomList = Object.entries(rooms);
    const chunks = [];
    for (let i = 0; i < roomList.length; i += 30) {
        chunks.push(roomList.slice(i, i + 30));
    }
    const result: DecorationSummary[] = [];
    let currChunk = 0;
    /* eslint-disable no-await-in-loop */
    for (const chunk of chunks) {
        console.log(`Scraping chunk ${currChunk} of ${chunks.length}`);
        const scrapingResults = await Promise.all(chunk.map(async ([name]) => {
            const decorations = await getDecoration(name, shard);
            return decorations;
        }));
        result.push(...(scrapingResults).map((r) => r.decorations).flat());
        currChunk += 1;
        // eslint-disable-next-line arrow-parens
        if (scrapingResults.some(r => r.rateLimitHit)) {
            console.warn('The rate limit has been hit while processing this chunk. Waiting for 10 seconds before continuing.');
            await sleep(10000);
        } else {
            await sleep(1000);
        }
    }
    /* eslint-enable no-await-in-loop */
    return result;
}

runScrape('shard3').then((d) => {
    console.log(`Found ${d.length} decorations.`);
    const uniqueDecorations = [];
    for (let i = 0; i < d.length; i += 1) {
        if (d.findIndex((decoration, idx) => idx > i && decoration.id === d[i].id)) {
            uniqueDecorations.push(d[i]);
        }
    }
    console.log(`${uniqueDecorations.length} are unique.`);

    console.log('Saving data');
    fs.writeFile('decorations.json', JSON.stringify(uniqueDecorations), (err) => {
        if (err) {
            console.log('Saving failed!');
        } else {
            console.log('Data saved successfully');
        }
    });
}).catch((e) => {
    console.log('Error:');
    console.log(e);
});

export { };
