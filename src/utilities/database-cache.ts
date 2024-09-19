import fetch from 'node-fetch';
import sqlite from 'sqlite3';
import interval from 'interval-promise';
import fs from 'fs';
import path from 'path';
import url from 'url';
// import { default as Fuse } from 'fuse.js'
import { default as Fuse } from 'fuse.js'
import { pipeline } from 'stream/promises';

//Types of cards
const types = {
    TYPE_MONSTER:     0x1,
    TYPE_SPELL:       0x2,
    TYPE_TRAP:        0x4,
    TYPE_NORMAL:      0x10,
    TYPE_EFFECT:      0x20,
    TYPE_FUSION:      0x40,
    TYPE_RITUAL:      0x80,
    TYPE_TRAPMONSTER: 0x100,
    TYPE_SPIRIT:      0x200,
    TYPE_UNION:       0x400,
    TYPE_GEMINI:      0x800,
    TYPE_TUNER:       0x1000,
    TYPE_SYNCHRO:     0x2000,
    TYPE_TOKEN:       0x4000,
    TYPE_MAXIMUM:     0x8000,
    TYPE_QUICKPLAY:   0x10000,
    TYPE_CONTINUOUS:  0x20000,
    TYPE_EQUIP:       0x40000,
    TYPE_FIELD:       0x80000,
    TYPE_COUNTER:     0x100000,
    TYPE_FLIP:        0x200000,
    TYPE_TOON:        0x400000,
    TYPE_XYZ:         0x800000,
    TYPE_PENDULUM:    0x1000000,
    TYPE_SPSUMMON:    0x2000000,
    TYPE_LINK:        0x4000000,
};

function getBitField(num: number, bitlist: Record<string, number>): Array<keyof typeof bitlist> {
    const fields: Array<keyof typeof bitlist> = [];
    for (const [name, mask] of Object.entries(bitlist)) {
        if ((num & mask) != 0) {
            fields.push(name);
        }
    }
    return fields;
}

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function downloadFile(url: string, path: string): Promise<void> {
    await pipeline((await fetch(url).then(e => e.body)) as any, fs.createWriteStream(path));
}

export class Card {
    /**
     * The names of the flags for this card's type parameter
     */
    public readonly typeFlags: Array<keyof typeof types>;

    /**
     * Instantiates a new card.
     * @param id The card ID
     * @param ot 
     * @param alias The card this card derives from, if any (else 0)
     * @param setcode The archetype the card belongs to, if any (else 0)
     * @param type The bitflags for the card's types
     * @param atk The card's ATK, if applicable (else 0)
     * @param def The card's DEF, if applicable (else 0)
     * @param level The card's Level, if applicable (else 0)
     * @param race The card's Type, if applicable (else 0)
     * @param attribute The card's Attribute, if applicable (else 0)
     * @param category The card's... something. We're not really sure yet.
     * @param database The database the card originates from (EDOPro or YGO Omega)
     * @param format The game format the card originates from (OCG/TCG or Rush)
     * @param name The card's display name in English
     * @param desc The card's description in English
     */
    constructor(
        public readonly id: number,
        public readonly ot: number,
        public readonly alias: number,
        public readonly setcode: number,
        public readonly type: number,
        public readonly atk: number,
        public readonly def: number,
        public readonly level: number,
        public readonly race: number,
        public readonly attribute: number,
        public readonly category: number,
        public readonly database: 'Ignis' | 'Omega',
        public readonly format: 'OCG/TCG' | 'Rush' | undefined,

        public readonly name: string,
        public readonly desc: string,
    ) {
        this.typeFlags = getBitField(type, types) as Array<keyof typeof types>;
    }

    get isOCGorTCGCard() {
        switch (this.database) {
            case 'Ignis':
                return this.format === 'OCG/TCG';
                break;
            case 'Omega':
                return this.ot < 4;
                break;
        }
    }

    get isRushCard() {
        switch (this.database) {
            case 'Ignis':
                return this.format === 'Rush';
                break;
            case 'Omega':
                return this.ot == 4 && this.alias == 120000000
                break;
        }
    }

    get isSkillCard() {
        return this.ot == 4 && this.setcode == 10377
    }
}

function loadDatabase(dbPath: string): Promise<Card[]> {
    return new Promise((resolve, reject) => {
        const sql = sqlite.verbose();
        const db = new sql.Database(dbPath, sqlite.OPEN_READONLY);
        db.serialize(() => {
            db.all(`
                SELECT
                    texts.id,
                    texts.name,
                    texts.desc,
                    datas.ot,
                    datas.alias,
                    datas.setcode,
                    datas.type,
                    datas.atk,
                    datas.def,
                    datas.level,
                    datas.race,
                    datas.attribute,
                    datas.category
                FROM texts
                INNER JOIN datas ON datas.id = texts.id
            `, (err, rows) => {
                if (err) reject(err);

                let format: Card["format"];
                let database: Card["database"];
                if (dbPath.endsWith('cards.cdb')) format = 'OCG/TCG', database = 'Ignis';
                if (dbPath.endsWith('cards-rush.cdb')) format = 'Rush', database = 'Ignis';
                if (dbPath.endsWith('OmegaDB.cdb')) format = undefined, database = 'Omega';

                resolve(rows.map(row => new Card(
                    row.id,
                    row.ot,
                    row.alias,
                    row.setcode,
                    row.type,
                    row.atk,
                    row.def,
                    row.level,
                    row.race,
                    row.attribute,
                    row.category,
                    database,
                    format,
                    row.name,
                    row.desc,
                )));
            })
        });
    });
}


async function updateIgnisDatabase(): Promise<Card[]> {
    console.log('Downloading cards.cdb...')
    await downloadFile('https://github.com/ProjectIgnis/BabelCDB/raw/master/cards.cdb', path.join(__dirname, '../databases/cards.cdb'));
    return await loadDatabase(path.join(__dirname, '../databases/cards.cdb'));
}

async function updateIgnisRushDatabase(): Promise<Card[]> {
    console.log('Downloading cards-rush.cdb...')
    await downloadFile('https://github.com/ProjectIgnis/BabelCDB/raw/master/cards-rush.cdb', path.join(__dirname, '../databases/cards-rush.cdb'));
    return await loadDatabase(path.join(__dirname, '../databases/cards-rush.cdb'));
}

async function updateOmegaDatabase(): Promise<Card[]> {
    console.log('Downloading OmegaDB.cdb...')
    await downloadFile('https://duelistsunite.org/omega/OmegaDB.cdb', path.join(__dirname, '../databases/OmegaDB.cdb'));
    return await loadDatabase(path.join(__dirname, '../databases/OmegaDB.cdb'));
}

let ignisCards = await updateIgnisDatabase();
console.log('Initial boot download of cards.cdb complete.');

let ignisRushCards = await updateIgnisRushDatabase();
console.log('Initial boot download of cards-rush.cdb complete.');

let omegaCards = await updateOmegaDatabase();
console.log('Initial boot download of OmegaDB.cdb complete.');

let ignisCardsByName = new Map<string, Card>(ignisCards.map(e => [e.name, e]));
let ignisCardsById = new Map<number, Card>(ignisCards.map(e => [e.id, e]));
let ignisRushCardsByName = new Map<string, Card>(ignisRushCards.map(e => [e.name, e]));
let ignisRushCardsById = new Map<number, Card>(ignisRushCards.map(e => [e.id, e]));
let omegaCardsByName = new Map<string, Card>(omegaCards.map(e => [e.name, e]));
let omegaCardsById = new Map<number, Card>(omegaCards.map(e => [e.id, e]));
let omegaRushCardsByName = new Map<string, Card>(omegaCards.filter(e => e.isRushCard).map(e => [e.name, e]))
let omegaRushCardsById = new Map<number, Card>(omegaCards.filter(e => e.isRushCard).map(e => [e.id, e]))

interval(async () => {
    ignisCards = await updateIgnisDatabase();
    ignisRushCards = await updateIgnisRushDatabase();
    omegaCards = await updateOmegaDatabase();

    ignisCardsByName = new Map<string, Card>(ignisCards.map(e => [e.name, e]));
    omegaCardsByName = new Map<string, Card>(omegaCards.map(e => [e.name, e]));
    ignisRushCardsByName = new Map<string, Card>(ignisRushCards.map(e => [e.name, e]));
    omegaRushCardsByName = new Map<string, Card>(omegaCards.filter(e => e.isRushCard).map(e => [e.name, e]))
    ignisCardsById = new Map<number, Card>(ignisCards.map(e => [e.id, e]));
    omegaCardsById = new Map<number, Card>(omegaCards.map(e => [e.id, e]));
    ignisRushCardsById = new Map<number, Card>(ignisRushCards.map(e => [e.id, e]));
    omegaRushCardsById = new Map<number, Card>(omegaCards.filter(e => e.isRushCard).map(e => [e.id, e]))

    console.log('6hr interval download of card databases complete.');
}, 21600000)

export function getCardNameForId(id: number, db?: 'ignis' | 'omega' | 'both', format?: 'ocgtcg' | 'rush'): string {
    if (!format || format === 'ocgtcg') {
        if (!db || db === 'both') {
            return ignisCardsById.get(id)?.name ?? omegaCardsById.get(id)!.name;
        } else if (db === 'ignis') {
            return ignisCardsById.get(id)!.name;
        } else {
            return omegaCardsById.get(id)!.name;
        }
    } else {
        if (!db || db === 'both') {
            return ignisRushCardsById.get(id)?.name ?? omegaRushCardsById.get(id)!.name;
        } else if (db === 'ignis') {
            return ignisRushCardsById.get(id)!.name;
        } else {
            return omegaRushCardsById.get(id)!.name;
        }
    }
}

export function getIdForCardName(name: string, db?: 'ignis' | 'omega' | 'both', format?: 'ocgtcg' | 'rush'): number {
    if (!format || format === 'ocgtcg') {
        if (!db || db === 'both') {
            return ignisCardsByName.get(name)?.id ?? omegaCardsByName.get(name)!.id;
        } else if (db === 'ignis') {
            return ignisCardsByName.get(name)!.id;
        } else {
            return omegaCardsByName.get(name)!.id;
        }
    } else {
        if (!db || db === 'both') {
            return ignisRushCardsByName.get(name)?.id ?? omegaRushCardsByName.get(name)!.id;
        } else if (db === 'ignis') {
            return ignisRushCardsByName.get(name)!.id;
        } else {
            return omegaRushCardsByName.get(name)!.id;
        }
    }
}

export function getTypeForId(id: number, db?: 'ignis' | 'omega' | 'both', format?: 'ocgtcg' | 'rush'): Array<keyof typeof types> {
    if (!format || format === 'ocgtcg') {
        if (!db || db === 'both') {
            return ignisCardsById.get(id)?.typeFlags ?? omegaCardsById.get(id)!.typeFlags;
        } else if (db === 'ignis') {
            return ignisCardsById.get(id)!.typeFlags;
        } else {
            return omegaCardsById.get(id)!.typeFlags;
        }
    } else {
        if (!db || db === 'both') {
            return ignisRushCardsById.get(id)?.typeFlags ?? omegaRushCardsById.get(id)!.typeFlags;
        } else if (db === 'ignis') {
            return ignisRushCardsById.get(id)!.typeFlags;
        } else {
            return omegaRushCardsById.get(id)!.typeFlags;
        }
    }
}

// Concat all the card names from database and omegaDatabase, make a Set (removes duplicates) then turn it back into an array again
const fuse = new Fuse([...new Set([
    ...ignisCards.filter(e => e.isOCGorTCGCard).map(e => e.name),
    ...omegaCards.filter(e => e.isOCGorTCGCard).map(e => e.name),
    ...ignisCards.filter(e => e.isOCGorTCGCard).map(e => String(e.id)),
    ...omegaCards.filter(e => e.isOCGorTCGCard).map(e => String(e.id)),
]).keys()], {
    isCaseSensitive: false,
    shouldSort: true,
    includeScore: true,
});

const fuserush = new Fuse([...new Set([
    ...ignisRushCards.map(e => e.name),
    ...ignisRushCards.map(e => String(e.id))
]).keys()], {
    isCaseSensitive: false,
    shouldSort: true,
    includeScore: true,
});

export function getFuzzyCardSearch(input: string | number, format: 'ocgtcg' | 'rush'): string[] {
    let results;
    if (format === 'ocgtcg') {
        results = fuse.search(String(input), {limit: 100});
    } else {
        results = fuserush.search(String(input), {limit: 100});
    }
    
    const output = results
        .map(match => { // make a map out of that bitch
            if (!isNaN(Number(match.item))) { // if the result is a number (that is, a card ID), parse it into the full card name
                let card: Card | undefined;
                switch (format) {
                    case 'ocgtcg':
                        card = ignisCardsById.get(Number(match.item)) ?? omegaCardsById.get(Number(match.item));
                        break;
                    case 'rush':
                        card = ignisRushCardsById.get(Number(match.item)) ?? omegaRushCardsById.get(Number(match.item));
                        break;
                };
                if (!card) return undefined; // if the card isn't anything at all, throw a fit about it (it gets removed from the array later)
                return { // if it is anything, sweet; return an object about it
                    item: card.name,
                    score: match.score,
                    isPerfectIdMatch: match.score === 0 // we only consider perfect ID matches to return as a single result later
                };
            } else { // otherwise it's a card name, just return it
                return match;
            }
        })
        .filter(e => e !== undefined); // clear out our fucked up undefined items

    // if the first result is a perfect match, and only if it's also an ID, return just the first result
    if (output[0] !== undefined && 'isPerfectIdMatch' in output[0] && output[0].isPerfectIdMatch) {
        return [output[0].item];
    } else { // otherwise return the result list
        return output.map(e => e!.item);
    }
}

// export default [database, omegaDatabase];