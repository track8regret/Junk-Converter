import { getCardNameForId, getIdForCardName, getTypeForId } from './database-cache.js';
import ydke, { extractURLs } from 'ydke';
import zlib from 'node:zlib';
import { promisify } from 'util';
import b64 from 'base64-js';
import jsdom from 'jsdom';
import fetch from 'node-fetch';
import sanitize from 'sanitize-filename';
const { JSDOM } = jsdom;

const deflateRaw = promisify(zlib.deflateRaw);
const inflateRaw = promisify(zlib.inflateRaw);

interface Deck {
    deckName?: string | null | undefined;
    mainDeck: number[];
    extraDeck: number[];
    sideDeck: number[];
}

interface JSONDeck {
    main: Deck['mainDeck'],
    extra: Deck['extraDeck'],
    side: Deck['sideDeck']
}

var emptyDeck: Deck = {
    mainDeck: [],
    extraDeck: [],
    sideDeck: []
}

abstract class Encoder {
    abstract decode(code: string): Promise<Deck> | Deck;
    abstract encode(deck: Deck): Promise<string> | string;
}

class YDKEncoder extends Encoder {
    override decode(code: string): Deck {
        var initial = code.split('\n');
        var fixedInitial = [];
        for (const entry of initial) {
            if(entry.endsWith("\r")) {
                var fixedEntry = entry.replace('\r', '')
                fixedInitial.push(fixedEntry)
            } else {
                if (entry != '') fixedInitial.push(entry);
            }
        }
        var mainIndex = fixedInitial.findIndex((element) => element === "#main");
        var extraIndex = fixedInitial.findIndex((element) => element === "#extra");
        var sideIndex = fixedInitial.findIndex((element) => element === "!side");

        var mainDeck = fixedInitial.slice(mainIndex+1, extraIndex).map(str => {
            return Number(str);
        })
        var extraDeck = fixedInitial.slice(extraIndex+1, sideIndex).map(str => {
            return (Number(str));
        })
        var sideDeck = fixedInitial.slice(sideIndex+1).map(str => {
            return (Number(str));
        })

        return {
            mainDeck: mainDeck,
            extraDeck: extraDeck,
            sideDeck: sideDeck
        }
    }
    override encode(deck: Deck): string {
        var result = [];
        result.push('#created by Junk Converter');
        result.push('#main');
        result.push(...deck.mainDeck);
        result.push('#extra');
        result.push(...deck.extraDeck);
        result.push('!side');
        result.push(...deck.sideDeck!);
        return result.join('\n');
    }
}

class YDKeEncoder extends Encoder {
    override decode(code: string): Deck {
        var parsed = ydke.parseURL(code);
        return {
            mainDeck: Array.from(parsed.main),
            extraDeck: Array.from(parsed.extra),
            sideDeck: Array.from(parsed.side)
        }

    }
    override encode(deck: Deck): string {
        return ydke.toURL({
            main: Uint32Array.from(deck.mainDeck),
            extra: Uint32Array.from(deck.extraDeck),
            side: Uint32Array.from(deck.sideDeck)
        })
    }
}

class OmegaEncoder extends Encoder {
    getUnsignedLong(arr: Uint8Array, pos: number): number { 
        const view = new DataView(arr.buffer, pos);
        return view.getUint32(0, true);
    }

    override async decode(code: string): Promise<Deck> {
        // trim input string
        var trimmed = code.trim();
        // decode base64 into byte array
        var bytearray = b64.toByteArray(trimmed);
        // inflate
        var inflated = new Uint8Array(await inflateRaw(bytearray));
        let position = 0;

        // read 1 byte: this is the size of the main and extra deck
        var mesize = inflated[position++];
        // read 1 byte: this is the size of the side deck
        var sidesize = inflated[position++];
        // 

        if(mesize > 75 || sidesize > 15) {
            console.log('One of the deck sizes in an Omega code was too big; returning an empty deck.')
            return emptyDeck;
        }

        const mainDeck = [];
        const extraDeck = [];
        const sideDeck = [];
        for (let i = 0; i < mesize; i++) {
            const rawCardID = this.getUnsignedLong(inflated, position);
            position += 4;
            const almostCardID = getCardNameForId(rawCardID, 'omega')
            const cardID = getIdForCardName(almostCardID)

            /*
            okay so omega is like, really stupid
            it separates cards from OCG (Japan) and TCG (worldwide) in their internal database
            and that fucks with getTypeForId for some reason
            so i'm just gonna throw the IDs for a loop and hope that it sorts itself out
            */
            
            const cardType = getTypeForId(cardID, 'omega');
            
            if (!cardType.includes('TYPE_FUSION') && !cardType.includes('TYPE_SYNCHRO') && !cardType.includes('TYPE_XYZ') && !cardType.includes('TYPE_LINK')) {
                mainDeck.push(cardID);
            } else {
                extraDeck.push(cardID);
            }
        }
        for (let i = 0; i < sidesize; i++) {
            const cardID = this.getUnsignedLong(inflated, position);
            position += 4;
            sideDeck.push(cardID);
        }

        return {
            mainDeck,
            extraDeck,
            sideDeck,
        }
    }

    override async encode(deck: Deck): Promise<string> {
        const buffer = new ArrayBuffer(((deck.mainDeck.length + deck.extraDeck.length + deck.sideDeck.length) * 4) + 2);
        const view = new DataView(buffer);

        let position = 0;
        view.setUint8(position++, deck.mainDeck.length + deck.extraDeck.length);
        view.setUint8(position++, deck.sideDeck.length);
        for (const card of deck.mainDeck) {
            view.setUint32(position, card, true);
            position += 4;
        }
        for (const card of deck.extraDeck) {
            view.setUint32(position, card, true);
            position += 4;
        }
        for (const card of deck.sideDeck) {
            view.setUint32(position, card, true);
            position += 4;
        }
        console.log(position);
        console.log(new Uint8Array(buffer).length);
        console.log(deck.mainDeck.length + deck.extraDeck.length);
        console.log(deck.sideDeck.length);
        const deflated = await deflateRaw(Buffer.from(buffer));
        const base64 = deflated.toString('base64');
        return base64;
    }
}

class NamelistEncoder extends Encoder {
    override decode(code: string): Deck {
        var initial = code.trim().split('\n\n')
        var mainArray = initial[0]?.trim().split('\n')
        var extraArray = initial[1]?.trim().split('\n')
        var sideArray = initial[2]?.trim().split('\n')

        var mdar = [];
        var exar = [];
        var sdar = [];

        for (const entry of mainArray) {
            if (entry.trim() === '') continue;

            var prep = entry.split(/(?<=^\S+)\s/)
            var amount = ~~prep[0]
            var cardname = prep[1].trim();
            mdar.push([Number(amount), String(cardname)])
        }

        if (extraArray) {
            for (const entry of extraArray) {
                if (entry.trim() === '') continue;

                var prep = entry.split(/(?<=^\S+)\s/)
                var amount = ~~prep[0]
                var cardname = prep[1].trim();
                exar.push([Number(amount), String(cardname)])
            }
        }

        if (sideArray) {
            for (const entry of sideArray) {
                if (entry.trim() === '') continue;

                var prep = entry.split(/(?<=^\S+)\s/)
                var amount = ~~prep[0]
                var cardname = prep[1].trim();
                sdar.push([Number(amount), String(cardname)])
            }
        }

        var mdai = [];
        for (const [amount, name] of mdar) {
            for (var i = 0; i < amount; i++) {
                mdai.push(getIdForCardName(name as string))
            }
        }
        var exai = [];
        for (const [amount, name] of exar) {
            for (var i = 0; i < amount; i++) {
                exai.push(getIdForCardName(name as string))
            }
        }
        var sdai = [];
        for (const [amount, name] of sdar) {
            for (var i = 0; i < amount; i++) {
                sdai.push(getIdForCardName(name as string))
            }
        }

        return {
            mainDeck: mdai,
            extraDeck: exai,
            sideDeck: sdai
        }
    }
    override encode(deck: Deck): string {
        var mdnd = [...new Set(deck.mainDeck)]
        var exnd = [...new Set(deck.extraDeck)]
        var sdnd = [...new Set(deck.sideDeck)]

        var mdai = mdnd.map(value => [deck.mainDeck.filter(str => str === value).length, value])
        var exai = exnd.map(value => [deck.extraDeck.filter(str => str === value).length, value])
        var sdai = sdnd.map(value => [deck.sideDeck.filter(str => str === value).length, value])

        var mdar = [];
        var exar = [];
        var sdar = [];

        for (const [amount, id] of mdai) {
            var cardname = getCardNameForId(id as number)
            mdar.push(amount + ' ' + cardname)
        }
        for (const [amount, id] of exai) {
            var cardname = getCardNameForId(id as number)
            exar.push(amount + ' ' + cardname)
        }
        for (const [amount, id] of sdai) {
            var cardname = getCardNameForId(id as number)
            sdar.push(amount + ' ' + cardname)
        }

        var maindeck = mdar.join('\n')
        var extradeck = exar.join('\n')
        var sidedeck = sdar.join('\n')
        var result = (maindeck + '\n\n' + extradeck + '\n\n' + sidedeck).trim()
        return result;
    }
}

class KonamiEncoder extends Encoder {
    override async decode(code: string): Promise<Deck> {
        var page = await fetch(code).then(e => e.text());

        var dom = new JSDOM(page);
        var document = dom.window.document

        var deckname = document.querySelector('#broad_title')?.textContent?.trim();

        // ask very nicely for the monster, spell, and trap tables
        var kmd = document.querySelectorAll('#text_main.deck_set .row');
        var mdar = [];
        for (const row of kmd) {
            var cardname = row.querySelector('.card_name')!.firstElementChild!.textContent;
            var amount = row.querySelector('.num')!.firstElementChild!.textContent;
            mdar.push([Number(amount), String(cardname)]);
        };

        // do the same thing for the extra deck
        var ked = document.querySelectorAll('#extra_list .row');
        var exar = [];
        for (const row of ked) {
            var cardname = row.querySelector('.card_name')!.firstElementChild!.textContent;
            var amount = row.querySelector('.num')!.firstElementChild!.textContent;
            exar.push([Number(amount), String(cardname)]);
        };

        // and the side deck
        var ksd = document.querySelectorAll('#side_list .row');
        var sdar = [];
        for (const row of ksd) {
            var cardname = row.querySelector('.card_name')!.firstElementChild!.textContent;
            var amount = row.querySelector('.num')!.firstElementChild!.textContent;
            sdar.push([Number(amount), String(cardname)]);
        };

        var mdai = [];
        for (const [amount, name] of mdar) {
            for (var i = 0; i < amount; i++) {
                mdai.push(getIdForCardName(name as string))
            }
        }
        var exai = [];
        for (const [amount, name] of exar) {
            for (var i = 0; i < amount; i++) {
                exai.push(getIdForCardName(name as string))
            }
        }
        var sdai = [];
        for (const [amount, name] of sdar) {
            for (var i = 0; i < amount; i++) {
                sdai.push(getIdForCardName(name as string))
            }
        }

        return {
            deckName: deckname,
            mainDeck: mdai,
            extraDeck: exai,
            sideDeck: sdai
        }
    }
    override encode(deck: Deck): string {
        return "Junk Converter cannot upload decks to the Konami database."
    }
}

class JSONEncoder extends Encoder {
    override decode(code: string): Deck {
        var file: JSONDeck = JSON.parse(code)
        return {
            mainDeck: file.main,
            extraDeck: file.extra,
            sideDeck: file.side
        }
    }
    override encode(deck: Deck): string {
        var result: JSONDeck = {
            main: deck.mainDeck,
            extra: deck.extraDeck,
            side: deck.sideDeck
        };
        return JSON.stringify(result, undefined, 4);
    }
}

export { Deck, Encoder, YDKEncoder, YDKeEncoder, OmegaEncoder, NamelistEncoder, KonamiEncoder, JSONEncoder }