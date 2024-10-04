import fetch from 'node-fetch';

export interface Card {
    name: string;
    type: CardType;
    id: number;
    atk?: number;
    def?: number;
    level?: number;
    race: CardRace;
    archetype?: string;
    archetype_relation?: string;
    action?: string;
    format?: 'Legends';
    tcg_date?: string;
    ocg_date?: string;
}

export type CardType = 'Normal Monster' | 'Effect Monster' | 'Tuner Monster' | 'Flip Effect Monster' | 'Spirit Monster' | 'Ritual Effect Monster' | 'Pendulum Normal Monster' | 'Fusion Monster' | 'Synchro Monster' | 'XYZ Monster' | 'Link Monster' | 'Spell Card' | 'Trap Card';
export type CardRace = 'Continuous' | 'Quick-Play' | 'Equip' | 'Normal' | 'Counter' | 'Beast' | 'Aqua' | 'Insect' | 'Fish' | 'Field' | 'Spellcaster' | 'Machine' | 'Ritual' | 'Warrior' | 'Fiend' | 'Beast-Warrior' | 'Rock' | 'Fairy' | 'Dragon' | 'Sea Serpent' | 'Plant' | 'Cyberse' | 'Wyrm' | 'Winged Beast' | 'Reptile' | 'Psychic' | 'Pyro' | 'Dinosaur' | 'Thunder' | 'Zombie' | 'Creator-God' | 'Illusion' | 'Galaxy' | 'High Dragon' | 'Cyborg' | 'Omega Psychic' | 'Celestial Warri' | 'Magical Knight'
export type Attribute = 'LIGHT' | 'EARTH' | 'WATER' | 'WIND' | 'FIRE' | 'DARK';

export interface Artwork {
    id: number;
    image_url: string;
    image_url_small: string;
}

export interface Response {
    data: Card[];
}

export class RushCardIO {
    protected baseURL: string = 'https://rushcard.io/api';

    constructor() {}

    async searchCard (input: string): Promise<Card | undefined> {
        let searchtype: '&id=' | '&n=';
        let response: Response;
        !isNaN(Number(input)) ? searchtype = '&id=' : searchtype = '&n='
        response = await fetch(this.baseURL + '/search.php?limit=10&sort=name' + searchtype + encodeURIComponent(input)).then(e => e.json()) as Response;

        return (response.data ? response.data[0] : undefined)
    }
}