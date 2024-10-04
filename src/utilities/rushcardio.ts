import fetch from 'node-fetch';
const { JANK } = process.env;

export interface Card {
    name: string;
    type: CardType;
    id: number;
    atk?: number;
    def?: number;
    level?: number;
    race: CardRace;
    attribute?: Attribute;
    desc: string;
    archetype?: string;
    archetype_relation?: string;
    action?: string;
    format?: undefined | 'Legends';
    tcg_date?: string;
    ocg_date?: string;
}

export type CardType = 'Normal Monster' | 'Effect Monster' | 'Tuner Monster' | 'Flip Effect Monster' | 'Spirit Monster' | 'Ritual Effect Monster' | 'Pendulum Normal Monster' | 'Fusion Monster' | 'Synchro Monster' | 'XYZ Monster' | 'Link Monster' | 'Spell Card' | 'Trap Card';
export type CardRace = 'Continuous' | 'Quick-Play' | 'Equip' | 'Normal' | 'Counter' | 'Beast' | 'Aqua' | 'Insect' | 'Fish' | 'Field' | 'Spellcaster' | 'Machine' | 'Ritual' | 'Warrior' | 'Fiend' | 'Beast-Warrior' | 'Rock' | 'Fairy' | 'Dragon' | 'Sea Serpent' | 'Plant' | 'Cyberse' | 'Wyrm' | 'Winged Beast' | 'Reptile' | 'Psychic' | 'Pyro' | 'Dinosaur' | 'Thunder' | 'Zombie' | 'Creator-God' | 'Illusion' | 'Galaxy' | 'High Dragon' | 'Cyborg' | 'Omega Psychic' | 'Celestial Warri' | 'Magical Knight'
export type Attribute = 'LIGHT' | 'EARTH' | 'WATER' | 'WIND' | 'FIRE' | 'DARK';

export interface Response {
    data: Card[];
}

export class RushCardIO {
    protected baseURL: string = 'https://rushcard.io/api';

    constructor() {}

    async searchCard (input: string): Promise<Card | undefined> {
        let response: Response;
        response = await fetch(this.baseURL + '/search.php?limit=15&sort=name&n=' + encodeURIComponent(input)).then(e => e.json()) as Response;
        if (JANK) {
            console.log('Rush search made for "' + input + '". Resulting search URL is https://rushcard.io/api/search.php?limit=15&sort=name&n=' + encodeURIComponent(input))
        }
        (response.data ? (console.log('RushCard.IO responded with ' + response.data.length + ' results.')) : console.log('RushCard.IO did not provide any results.'))
        return (response.data ? response.data[0] : undefined)
    }
}