import fetch from 'node-fetch';

export interface Card {
    id: number;
    name: string;
    type: CardType;
    desc: string;
    pend_desc?: string;
    monster_desc?: string;
    atk?: number;
    def?: number;
    level?: number;
    race: CardRace;
    attribute?: Attribute;
    archetype?: string;
    scale?: number;
    ygoprodeck_url: string;
    card_sets?: CardSet[];
    banlist_info?: BanlistInfo;
    linkval?: number;
    linkmarkers?: LinkMarker[];
    card_images: Artwork[];
    card_prices: Price[];
}

export type CardType = 'Normal Monster' | 'Normal Tuner Monster' | 'Effect Monster' | 'Tuner Monster' | 'Flip Effect Monster' | 'Gemini Monster' | 'Union Effect Monster' | 'Spirit Monster' | 'Toon Monster' | 'Ritual Effect Monster' | 'Ritual Monster' | 'Pendulum Normal Monster' | 'Pendulum Effect Monster' | 'Pendulum Tuner Effect Monster' | 'Pendulum Flip Effect Monster' | 'Fusion Monster' | 'Pendulum Effect Fusion Monster' | 'Synchro Monster' | 'Synchro Tuner Monster' | 'Synchro Pendulum Effect Monster' | 'XYZ Monster' | 'XYZ Pendulum Effect Monster' | 'Link Monster' | 'Spell Card' | 'Trap Card' | 'Skill Card' | 'Token';
export type CardRace = 'Continuous' | 'Quick-Play' | 'Equip' | 'Normal' | 'Counter' | 'Beast' | 'Aqua' | 'Insect' | 'Fish' | 'Field' | 'Spellcaster' | 'Machine' | 'Ritual' | 'Warrior' | 'Fiend' | 'Beast-Warrior' | 'Rock' | 'Fairy' | 'Dragon' | 'Sea Serpent' | 'Plant' | 'Cyberse' | 'Wyrm' | 'Winged Beast' | 'Reptile' | 'Psychic' | 'Pyro' | 'Dinosaur' | 'Thunder' | 'Zombie' | 'Creator-God' | 'Illusion' | SkillRace;
export type SkillRace = 'Mai' | 'Keith' | 'Yami Yugi' | 'Kaiba' | 'Bonz' | 'Mako' | 'Weevil' | 'Yugi' | 'David' | 'Rex' | 'Odion' | 'Christine' | 'Ishizu' | 'Joey' | 'Yami Marik' | 'Joey Wheeler' | 'Yami Bakura' | 'Pegasus' | 'Espa Roba' | 'Seto Kaiba' | 'Andrew' | 'Arkana' | 'Mai Valentine' | 'Divine-Beast' | 'Tea Gardner' | 'Ishizu Ishtar' | 'Emma' | 'Lumis Umbra';
export type Attribute = 'DIVINE' | 'LIGHT' | 'EARTH' | 'WATER' | 'WIND' | 'FIRE' | 'DARK';

export interface CardSet {
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_rarity_code: string;
    set_price: string;
}

export type BanStatus = 'Banned' | 'Limited' | 'Semi-Limited'

export interface BanlistInfo {
    ban_tcg?: BanStatus;
    ban_ocg?: BanStatus;
    ban_goat?: BanStatus;
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

export class YGOPRODeck {
    protected baseURL: string = 'https://db.ygoprodeck.com/api/v7';

    constructor() {}

    async searchCard (input: string | number, format?: 'ocgtcg' | 'rush'): Promise<Card | undefined> {
        let searchtype: '?id=' | '?name=';
        let response: Response;
        !isNaN(Number(input)) ? searchtype = '?id=' : searchtype = '?name='
        switch (format) {
            default:
                response = await fetch(this.baseURL + '/cardinfo.php' + searchtype + encodeURIComponent(input)).then(e => e.json()) as Response;
                break;
            case 'ocgtcg':
                response = await fetch(this.baseURL + '/cardinfo.php' + searchtype + encodeURIComponent(input)).then(e => e.json()) as Response;
                break;
            case 'rush':
                response = await fetch(this.baseURL + '/cardinfo.php' + searchtype + encodeURIComponent(input) + '&format=rush%20duel').then(e => e.json()) as Response;
                break;
        }
        return (response.data ? response.data[0] : undefined)
    }
}