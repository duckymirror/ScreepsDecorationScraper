import bent, { RequestFunction, NodeResponse } from "bent";
const getString = bent("string");
import got from "got";

async function sleep(ms: number) {
    await new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function runScrape(shard: string) {
    const json = await getString(`https://www.leagueofautomatednations.com/map/${shard}/rooms.js`);
    const data: LOANRooms = JSON.parse(json);
    const rooms: LOANRooms = {};
    for (const room in data) {
        if (data[room].level > 0) {
            rooms[room] = data[room];
        }
    }
    const roomList = Object.entries(rooms);
    const chunks = [];
    for (let i = 0; i < roomList.length; i += 50) {
        chunks.push(roomList.slice(i, i + 50));
    }
    const result = [];
    let currChunk = 0;
    for (const chunk of chunks) {
        console.log(`Scraping chunk ${currChunk} of ${chunks.length}`);
        result.push(...(await Promise.all(chunk.map(async ([name, room]) => {
            const decorations = await getDecoration(name, shard);
            return decorations;
        }))).flat());
        currChunk += 1;
        await sleep(1000);
    }
    return result;
}

async function getDecoration(room: string, shard: string) {
    try {
        const response = await got(`https://screeps.com/api/game/room-decorations?room=${room}&shard=${shard}`);
        const decorations: Decorations = JSON.parse(response.body);
        return decorations.decorations.map(d => ({ id: d.decoration._id, url: d.decoration.foregroundUrl, type: d.decoration.type, rarity: d.decoration.rarity }));
    } catch (e) {
        if (e instanceof got.HTTPError) {
            if (e.response.statusCode === 429) {
                console.log("Rate limit hit. Retrying in 3 seconds.");
                return await new Promise((resolve, reject) => {
                    setTimeout(async () => resolve(await getDecoration(room, shard)), 3000);
                });
            }
        }
    }
}

const promise = runScrape("shard3").then(d => {
    console.log(JSON.stringify(d));
}).catch(e => {
    console.log("Error:");
    console.log(e);
});

export { }
