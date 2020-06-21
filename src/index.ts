import got from 'got';
import fs from 'fs';
import mustache from 'mustache';
import { isFloorLandscapeDecoration, isWallLandscapeDecoration, isWallGraffitiDecoration } from './decorationsAPIHelper';

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

function formatTime(ms: number): string {
    return `${Math.floor(ms / 3600000)}:${Math.floor((ms % 3600000) / 60000)}:${Math.floor((ms % 60000) / 1000)}.${Math.round(ms % 1000)}`;
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

async function scrape(shards: string[]) {
    console.log('Retrieving rooms list');
    let startTime = Date.now();
    const allRooms = (await Promise.all(shards.map(async (shard) => {
        console.log(`Getting rooms on ${shard}`);
        const response = await got(`https://www.leagueofautomatednations.com/map/${shard}/rooms.js`);
        const data: LOANRooms = JSON.parse(response.body);
        return Object.entries(data).map(([name, room]) => ({
            shard,
            name,
            room,
        }));
    }))).flat();
    console.log(`Took ${formatTime(Date.now() - startTime)}`);
    const rooms = [];
    for (const room of allRooms) {
        if (room.room.level > 0) {
            rooms.push(room);
        }
    }
    const chunks = [];
    for (let i = 0; i < rooms.length; i += 30) {
        chunks.push(rooms.slice(i, i + 30));
    }
    const result: DecorationSummary[] = [];
    let currChunk = 0;
    startTime = Date.now();
    /* eslint-disable no-await-in-loop */
    for (const chunk of chunks) {
        const elapsedTime = Date.now() - startTime;
        console.log(`Processing chunk ${currChunk} of ${chunks.length} (${chunk[0].shard}/${chunk[0].name} - ${chunk[chunk.length - 1].shard}/${chunk[chunk.length - 1].name}) - Elapsed: ${formatTime(elapsedTime)}, ETA: ${formatTime((elapsedTime / currChunk) * chunks.length - elapsedTime)}`);
        const scrapingResults = await Promise.all(chunk.map(async (room) => {
            const decorations = await getDecoration(room.name, room.shard);
            return decorations;
        }));
        result.push(...(scrapingResults).map((r) => r.decorations).flat());
        currChunk += 1;
        if (scrapingResults.some((r) => r.rateLimitHit)) {
            console.warn('The rate limit has been hit while processing this chunk. Waiting for 10 seconds before continuing.');
            await sleep(10000);
        } else {
            await sleep(1000);
        }
    }
    /* eslint-enable no-await-in-loop */
    console.log(`Finished scraping. Took ${formatTime(Date.now() - startTime)}`);
    return result;
}

function saveHTML(data: DecorationSummary[]) {
    console.log('Generating HTML');
    const groupedDecorations = data.reduce((rv: {
        [type: string]: DecorationSummary[];
    }, x) => {
        // eslint-disable-next-line no-param-reassign
        (rv[x.type] = rv[x.type] || []).push(x);
        return rv;
    }, {});
    const html = mustache.render(fs.readFileSync('src/template.mustache', 'utf8'), groupedDecorations);
    console.log('Saving HTML');
    fs.writeFileSync('decorations.html', html);
}

if (process.argv.includes('--html')) {
    const data = JSON.parse(fs.readFileSync('decorations.json', 'utf8')) as DecorationSummary[];
    saveHTML(data);
} else {
    scrape(['shard0', 'shard1', 'shard2', 'shard3']).then((d) => {
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
        saveHTML(uniqueDecorations);
    }).catch((e) => {
        console.log('Error:');
        console.log(e);
    });
}

export { };
