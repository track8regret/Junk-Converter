import fetch from 'node-fetch';

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
}

export type MonsterClass = 'Normal' | 'Effect' | 'Flip' | 'Spirit' | 'Gemini' | 'Union' | 'Toon' | 'Tuner' | 'Pendulum' | 'Ritual' | 'Fusion' | 'Synchro' | 'XYZ' | 'Link'
export type CardSpecies = 'Monster' | 'Spell' | 'Trap'
export type LinkMarker = 'Top' | 'Bottom' | 'Left' | 'Right' | 'Top-Left' | 'Top-Right' | 'Bottom-Left' | 'Bottom-Right';
export type MonsterType = 'Continuous' | 'Quick-Play' | 'Equip' | 'Normal' | 'Counter' | 'Beast' | 'Aqua' | 'Insect' | 'Fish' | 'Field' | 'Spellcaster' | 'Machine' | 'Ritual' | 'Warrior' | 'Fiend' | 'Beast-Warrior' | 'Rock' | 'Fairy' | 'Dragon' | 'Sea Serpent' | 'Plant' | 'Cyberse' | 'Wyrm' | 'Winged Beast' | 'Reptile' | 'Psychic' | 'Pyro' | 'Dinosaur' | 'Thunder' | 'Zombie' | 'Creator-God'
export type Attribute = 'DIVINE' | 'LIGHT' | 'EARTH' | 'WATER' | 'WIND' | 'FIRE' | 'DARK';
export type Rarity = 'N' | 'R' | 'SR' | 'UR';
export type BanStatus = 'Forbidden' | 'Limited 1' | 'Limited 2'

export interface ObtainSource {
    amount: number,
    source: {
        _id: number,
        name: string
    },
    subSource?: string,
    type: 'characters' | 'sets' | 'otherSources'
}

export type Response = Card[];

export async function searchDLMByName(name: string): Promise<Card> {
    var response: Response = await fetch('https://www.duellinksmeta.com/api/v1/cards?name=' + encodeURIComponent(name)).then(e => e.json()) as Response;
    var noalts = response.filter(card => !card.alternateArt)
    if (noalts.every(card => card.popRank === Number.MAX_VALUE)) {
        return noalts[0]
    } else {
        return noalts.reduce((pop, card) => card.popRank != Number.MAX_VALUE && pop.popRank > card.popRank ? pop : card)
    }
}

export async function searchMDMByName(name: string): Promise<Card> {
    var response: Response = await fetch('https://www.masterduelmeta.com/api/v1/cards?name=' + encodeURIComponent(name)).then(e => e.json()) as Response;
    var noalts = response.filter(card => !card.alternateArt)
    if (noalts.every(card => card.popRank === Number.MAX_VALUE)) {
        return noalts[0]
    } else {
        return noalts.reduce((pop, card) => card.popRank != Number.MAX_VALUE && pop.popRank > card.popRank ? pop : card)
    }
}