import fetch from 'node-fetch';
import interval from 'interval-promise';
import { default as Fuse } from 'fuse.js';

export interface Card {
    _id: string,
    monsterType: MonsterClass[],
    popRank: number,
    name: string,
    konamiID: string,
    alternateArt?: boolean,
    type: CardSpecies,
    level?: number,
    linkRating?: number,
    linkArrows?: LinkMarker,
    race: MonsterType,
    attribute?: Attribute,
    atk?: number,
    def?: number,
    rarity?: Rarity,
    description: string,
    obtain?: ObtainSource[],
    release?: Date,
    banStatus?: BanStatus,
    ocgRelease?: Date,
    tcgRelease?: Date
};

export interface Set {
    _id: string,
    type: SetType,
    expires?: Date,
    deckTypes?: SetDeckTypes[],
    name: string,
    release: Date,
    description?: string,
    icon: SetIcon,
    linkedArticle: SetArticle,
    bannerImage: string
};

export type MonsterClass = 'Normal' | 'Effect' | 'Flip' | 'Spirit' | 'Gemini' | 'Union' | 'Toon' | 'Tuner' | 'Pendulum' | 'Ritual' | 'Fusion' | 'Synchro' | 'XYZ' | 'Link';
export type CardSpecies = 'Monster' | 'Spell' | 'Trap';
export type LinkMarker = 'Top' | 'Bottom' | 'Left' | 'Right' | 'Top-Left' | 'Top-Right' | 'Bottom-Left' | 'Bottom-Right';
export type MonsterType = 'Continuous' | 'Quick-Play' | 'Equip' | 'Normal' | 'Counter' | 'Beast' | 'Aqua' | 'Insect' | 'Fish' | 'Field' | 'Spellcaster' | 'Machine' | 'Ritual' | 'Warrior' | 'Fiend' | 'Beast-Warrior' | 'Rock' | 'Fairy' | 'Dragon' | 'Sea Serpent' | 'Plant' | 'Cyberse' | 'Wyrm' | 'Winged Beast' | 'Reptile' | 'Psychic' | 'Pyro' | 'Dinosaur' | 'Thunder' | 'Zombie' | 'Creator-God';
export type Attribute = 'DIVINE' | 'LIGHT' | 'EARTH' | 'WATER' | 'WIND' | 'FIRE' | 'DARK';
export type Rarity = 'N' | 'R' | 'SR' | 'UR';
export type BanStatus = 'Forbidden' | 'Limited 1' | 'Limited 2';
export interface ObtainSource {
    amount: number,
    source: {
        _id: number,
        name: string
    },
    subSource?: string,
    type: 'characters' | 'sets' | 'otherSources'
};

export type SetType = 'Normal Pack' | 'Selection Pack' | 'Secret Pack' | 'Bonus Pack' | 'Structure Deck' | 'Main Box' | 'Mini Box' | 'Structure Deck EX' | 'Selection Box' | 'Selection Box Mini';
export interface SetDeckTypes {
    _id: string,
    name: string
};
export interface SetIcon {
    _id: string,
    name: string
};
export interface SetArticle {
    _id: string,
    title: string,
    url: string,
    image: string
};

export class DuelLinksMeta {
    protected baseURL: string;
    protected baseImageURL: string = 'https://s3.duellinksmeta.com';

    constructor() {
        this.baseURL = 'https://www.duellinksmeta.com/api/v1';
    };

    async searchCard(input: string | number): Promise<Card> {
        let searchtype: '?id=' | '?name=';
        !isNaN(Number(input)) ? searchtype = '?id=' : searchtype = '?name=';
        var response: Card[] = await fetch(this.baseURL + '/cards' + searchtype + encodeURIComponent(input)).then(e => e.json()) as Card[];
        var noalts = response.filter(card => !card.alternateArt);
        if (noalts.every(card => card.popRank === Number.MAX_VALUE)) {
            return noalts[0];
        } else {
            return noalts.reduce((pop, card) => card.popRank != Number.MAX_VALUE && pop.popRank > card.popRank ? pop : card);
        };
    };

    async searchSet(input: string): Promise<Set> {
        var response: Set[] = await fetch(this.baseURL + '/sets?name=' + encodeURIComponent(input)).then(e => e.json()) as Set[];
        return response[0];
    };
};

export class MasterDuelMeta extends DuelLinksMeta {
    constructor() {
        super();
        this.baseURL = 'https://www.masterduelmeta.com/api/v1';
    };
};

async function cacheDLMSetNames () {
    console.log('Updating cached DuelLinksMeta set names...')
    var response: Set[] = await fetch('https://www.duellinksmeta.com/api/v1/sets?limit=3000').then(e => e.json()) as Set[];
    return response.map(e => e.name)
};

async function cacheMDMSetNames () {
    console.log('Updating cached MasterDuelMeta set names...')
    var response: Set[] = await fetch('https://www.masterduelmeta.com/api/v1/sets?limit=3000').then(e => e.json()) as Set[];
    return response.map(e => e.name)
};

let dlmsets = await cacheDLMSetNames();
console.log('Initial cache of DuelLinksMeta set names complete.')
let mdmsets = await cacheMDMSetNames();
console.log('Initial cache of MasterDuelMeta set names complete.')

interval(async () => {
    let dlmsets = await cacheDLMSetNames();
    let mdmsets = await cacheMDMSetNames();
    console.log('6hr cache of DLM/MDM set names complete.')
}, 21600000)

const fusedl = new Fuse(dlmsets, {
    isCaseSensitive: false,
    shouldSort: true,
    includeScore: true,
});

const fusemd = new Fuse(mdmsets, {
    isCaseSensitive: false,
    shouldSort: true,
    includeScore: true,
});

export function getFuzzySetSearch (input: string, game: 'dl' | 'md'): string[] {
    let results: Fuse.FuseResult<string>[];
    if (game === 'dl') {
        results = fusedl.search(String(input), {limit: 100});
    } else {
        results = fusemd.search(String(input), {limit: 100});
    }

    const output = results.filter(e => e !== undefined); // clear out our fucked up undefined items

    return output.map(e => e!.item);
}