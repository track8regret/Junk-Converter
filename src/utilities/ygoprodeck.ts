import fetch from 'node-fetch';

export interface Card {
    id: number;
    name: string;
    type: CardType;
    desc: string;
    atk?: number;
    def?: number;
    level?: number;
    race: CardRace;
    attribute?: Attribute;
    archetype?: string;
    scale?: number;
    card_sets?: CardSet[];
    linkval?: number;
    linkmarkers?: LinkMarker[];
    card_images: Artwork[];
    card_prices: Price[];
}

export type CardType = 'Normal Monster' | 'Normal Tuner Monster' | 'Effect Monster' | 'Tuner Monster' | 'Flip Effect Monster' | 'Gemini Monster' | 'Union Effect Monster' | 'Spirit Monster' | 'Toon Monster' | 'Ritual Effect Monster' | 'Ritual Monster' | 'Pendulum Normal Monster' | 'Pendulum Effect Monster' | 'Pendulum Tuner Effect Monster' | 'Pendulum Flip Effect Monster' | 'Fusion Monster' | 'Pendulum Effect Fusion Monster' | 'Synchro Monster' | 'Synchro Tuner Monster' | 'Synchro Pendulum Effect Monster' | 'XYZ Monster' | 'XYZ Pendulum Effect Monster' | 'Link Monster' | 'Spell Card' | 'Trap Card' | 'Skill Card' | 'Token';
export type CardRace = 'Continuous' | 'Quick-Play' | 'Equip' | 'Normal' | 'Counter' | 'Beast' | 'Aqua' | 'Insect' | 'Fish' | 'Field' | 'Spellcaster' | 'Machine' | 'Ritual' | 'Warrior' | 'Fiend' | 'Beast-Warrior' | 'Rock' | 'Fairy' | 'Dragon' | 'Sea Serpent' | 'Plant' | 'Cyberse' | 'Wyrm' | 'Winged Beast' | 'Reptile' | 'Psychic' | 'Pyro' | 'Dinosaur' | 'Thunder' | 'Zombie' | 'Creator-God' | SkillRace;
export type SkillRace = 'Mai' | 'Keith' | 'Yami Yugi' | 'Kaiba' | 'Bonz' | 'Mako' | 'Weevil' | 'Yugi' | 'David' | 'Rex' | 'Odion' | 'Christine' | 'Ishizu' | 'Joey' | 'Yami Marik' | 'Joey Wheeler' | 'Yami Bakura' | 'Pegasus' | 'Espa Roba' | 'Seto Kaiba' | 'Andrew' | 'Arkana' | 'Mai Valentine' | 'Divine-Beast' | 'Tea Gardner' | 'Ishizu Ishtar' | 'Emma' | 'Lumis Umbra';
export type Attribute = 'DIVINE' | 'LIGHT' | 'EARTH' | 'WATER' | 'WIND' | 'FIRE' | 'DARK';

export interface CardSet {
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_rarity_code: string;
    set_price: string;
}

export type LinkMarker = 'Top' | 'Bottom' | 'Left' | 'Right' | 'Top-Left' | 'Top-Right' | 'Bottom-Left' | 'Bottom-Right';

export interface Artwork {
    id: number;
    image_url: string;
    image_url_small: string;
}

export interface Price {
    cardmarket_price: string;
    tcgplayer_price: string;
    ebay_price: string;
    amazon_price: string;
    coolstuffinc_price: string;
}

export interface Response {
    data: Card[];
}

export async function searchYPDByName(name: string, format?: 'ocgtcg' | 'rush'): Promise<Card | undefined> {
    if (!format || format === 'ocgtcg') {
        var response: Response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?name=' + encodeURIComponent(name)).then(e => e.json()) as Response;
    } else {
        var response: Response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?format=rush%20duel&name=' + encodeURIComponent(name)).then(e => e.json()) as Response;
    }
    return (response.data ? response.data[0] : undefined);
}

export async function searchYPDByID(id: number, format?: 'ocgtcg' | 'rush'): Promise<Card | undefined> {
    if (!format || format === 'ocgtcg') {
        var response: Response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + encodeURIComponent(id)).then(e => e.json()) as Response;
    } else {
        console.log('ID to be searched: ' + id)
        var response: Response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?format=rush%20duel&id=' + encodeURIComponent(id)).then(e => e.json()) as Response;
    }
    return (response.data ? response.data[0] : undefined);
}