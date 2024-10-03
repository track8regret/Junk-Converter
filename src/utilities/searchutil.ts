import { CommandContext, MessageEmbedOptions, EmbedField } from 'slash-create';
import fetch from 'node-fetch';
import { YGOPRODeck, LinkMarker, Card as YPDCard } from '../utilities/ygoprodeck.js'
import { DuelLinksMeta, MasterDuelMeta, Card as DLMCard, Set as DLMSet } from '../utilities/duellinksmeta.js';
import { getIdForCardName, getTypeForId } from '../utilities/database-cache.js'
import allemoji from '../utilities/emojis.json' with { type: "json" }
const { JANK } = process.env

var emojis = allemoji.junk
if(JANK === "true") {
    emojis = allemoji.jank
}

const YPD = new YGOPRODeck();
const DLM = new DuelLinksMeta();
const MDM = new MasterDuelMeta();

export async function searchCard (query: string, ctx: CommandContext, format?: 'ocgtcg' | 'rush' | undefined) {
    let cardinfo: YPDCard | undefined;
    let dlcard: DLMCard | undefined;
    let mdcard: DLMCard | undefined;
    if (!isNaN(Number(query))) {
        if (!format || format === 'ocgtcg') {
            cardinfo = await YPD.searchCard(Number(query));
            dlcard = await DLM.searchCard(Number(query));
            mdcard = await MDM.searchCard(Number(query));
        } else {
            cardinfo = await YPD.searchCard(Number(query), 'rush');
            dlcard = undefined;
            mdcard = undefined;
        }
    } else {
        if (!format || format === 'ocgtcg') {
            cardinfo = await YPD.searchCard(query)
            dlcard = await DLM.searchCard(query)
            mdcard = await MDM.searchCard(query)
        } else {
            cardinfo = await YPD.searchCard((query.endsWith(' (Rush)') ? query.replace(' (Rush)', ' (Rush Duel)') : query), 'rush');
            dlcard = undefined;
            mdcard = undefined;
        }
    }

    if (cardinfo === undefined) {
        // do something, exit
        return ctx.send({content: 'The card you searched for turned up as undefined in our search.\nUsually, this happens when YGOPRODeck doesn\'t have information on a card we list.\nIf you suspect it\'s something else, please try again.', ephemeral: true})
    }

    let embedfields: Array<EmbedField> = [];

    let tradban: string = '';
    if (cardinfo.banlist_info) {
        if (cardinfo.banlist_info.ban_tcg) {
            tradban += '\n**TCG Status:** ' + emojis.lflist[cardinfo.banlist_info.ban_tcg] + ' ' + cardinfo.banlist_info.ban_tcg
        }
        if (cardinfo.banlist_info.ban_ocg) {
            tradban += '\n**OCG Status:** ' + emojis.lflist[cardinfo.banlist_info.ban_ocg] + ' ' + cardinfo.banlist_info.ban_ocg
        }
        if (cardinfo.banlist_info.ban_goat) {
            tradban += '\n**GOAT Status:** ' + emojis.lflist[cardinfo.banlist_info.ban_goat] + ' ' + cardinfo.banlist_info.ban_goat
        }
    }

    if (!format || format === 'ocgtcg' || format === 'rush' && !cardinfo.desc.includes('[REQUIREMENT]')) {
        if (!cardinfo.type.includes('Pendulum')) {
            embedfields.push({
                name: 'Description',
                value: cardinfo.desc,
                inline: false
            })
        } else {
            var inconsistent = (cardinfo.desc.includes('----------------------------------------') ? cardinfo.desc.replace('----------------------------------------', '') : cardinfo.desc)
            var pendeffect = inconsistent.split('[ Pendulum Effect ]')[1].split('[')[0]
            var monstereffect = inconsistent.split('[ Monster Effect ]')[1]
            embedfields.push({name: 'Pendulum Effect', value: pendeffect, inline: false})
            embedfields.push({name: 'Monster Effect', value: monstereffect, inline: false})
        }
    }

    if (format === 'rush' && cardinfo.desc.includes('[REQUIREMENT]')) {
        var fuckypd = cardinfo.desc.replace(/[:;]+(?!\ )/g, '')
        var requirement = fuckypd.split('[REQUIREMENT]')[1].split('[')[0]
        embedfields.push({name: 'Requirement', value: requirement})
        if (fuckypd.includes('[EFFECT]')) {
            var effect = fuckypd.split('[EFFECT]')[1]
            embedfields.push({name: 'Effect', value: effect})
        }
        if (fuckypd.includes('[MULTI-CHOICE EFFECT]')) {
            var effect = fuckypd.split('[MULTI-CHOICE EFFECT]')[1]
            embedfields.push({name: 'Possible Effects', value: effect})
        }
    }

    let embedcolor = 0x000000;
    let leveltext: string = '';

    const matchers: Array<[(card: YPDCard) => boolean, number]> = [
        [cardinfo => cardinfo.type.includes('Link'), 0x0685CC],
        [cardinfo => cardinfo.type.includes('XYZ'), 0x161616],
        [cardinfo => cardinfo.type.includes('Synchro'), 0xE7E6E4],
        [cardinfo => cardinfo.type.includes('Fusion'), 0x8E3E9D],
        [cardinfo => cardinfo.type.includes('Ritual'), 0x476FB5],
        [cardinfo => cardinfo.type.includes('Pendulum'), 0x5CB8AD],
        [cardinfo => cardinfo.type.includes('Effect'), 0xC75227],
        [cardinfo => cardinfo.type.includes('Spell'), 0x008B78],
        [cardinfo => cardinfo.type.includes('Trap'), 0xA5146F],
        [cardinfo => cardinfo.type.includes('Normal'), 0xCC9A53]
    ];

    for (const [matcher, color] of matchers) {
        if (matcher(cardinfo)) {
            embedcolor = color;
            break;
        }
    }

    if(cardinfo.type.includes('Monster')) {
        if (cardinfo.type.includes('XYZ')) {
            leveltext += emojis.level.rank + ' **Rank ' + cardinfo.level + '**'
        } else if (cardinfo.type.includes('Link')) {
            leveltext += emojis.level.link + ' **LINK-' + cardinfo.linkval + '**'

            const rows: (LinkMarker | number)[][] = [
                ['Top-Left', 'Top', 'Top-Right'],
                ['Left', cardinfo.linkval!, 'Right'],
                ['Bottom-Left', 'Bottom', 'Bottom-Right']
            ];

            const rowstext = rows.map(row => row.map(e => typeof e === 'number'
                ? emojis.number[String(e) as keyof typeof emojis.number]
                : emojis.arrow[String(cardinfo!.linkmarkers?.includes(e) ?? false) as keyof typeof emojis.arrow][e]).join(''))
                .join('\n');

            embedfields.push({name: 'Link Arrows', value: rowstext, inline: true})
            embedfields.push({name: 'ATK', value: '**' + cardinfo.atk +  '**', inline: true})
        } else {
            leveltext += emojis.level.level + ' **Level ' + cardinfo.level + '**'
        }

        if (cardinfo.type.includes('Pendulum')) {
            embedfields.push({name: 'Pendulum Scales', value: emojis.scale.left + ' **' + cardinfo.scale + '/' + cardinfo.scale + '** ' + emojis.scale.right, inline: true})
        }

        if (!cardinfo.type.includes('Link')) {
            embedfields.push({name: 'ATK/DEF', value: '**' + cardinfo.atk + ' / ' + cardinfo.def + '**', inline: true})
        }
    }

    if ((cardinfo.card_sets && format !== 'rush') || (dlcard && dlcard.rarity && format !== 'rush') || (mdcard && mdcard.rarity && format !== 'rush')) {
        let settext = '';
        let dltext = '';
        let mdtext = '';

        if (cardinfo.card_sets && cardinfo.card_sets.length != 0) {
            settext += '**Prints:**'
            for (const set of cardinfo.card_sets) {
                settext += '\n[' + set.set_name + '](https://yugipedia.com/wiki/' + encodeURIComponent(set.set_name) + ') - [' + set.set_code + '](https://yugipedia.com/wiki/' + encodeURIComponent(set.set_code) + ') (' + set.set_rarity + ')'
            }
        }
        
        if (dlcard && dlcard.rarity) {
            dltext += '**Rarity:** ' + emojis.rarity.DL[dlcard.rarity]
            switch (dlcard.banStatus) {
                case 'Forbidden':
                    dltext += '\n**Status:** ' + emojis.lflist[dlcard.banStatus] + ' Forbidden'
                    break;
                case 'Limited 1':
                    dltext += '\n**Status:** ' + emojis.lflist[dlcard.banStatus] + ' Limited'
                    break;
                case 'Limited 2':
                    dltext += '\n**Status:** ' + emojis.lflist[dlcard.banStatus] + ' Semi-Limited'
                    break;
                case undefined:
                    dltext += '\n**Status:** Unlimited'
                    break;               
            }
        }

        if (dlcard && dlcard.obtain && dlcard.obtain.length != 0) {
            dltext += '\n\n**How to Obtain:**'
            for (const source of dlcard.obtain) {
                switch (source.type) {
                    case 'characters':
                        dltext += '\n[' + source.source.name + ' ' + source.subSource + '](https://www.duellinksmeta.com/characters/' + encodeURIComponent(source.source.name) + ')'
                        break;
                    case 'sets':
                        dltext += '\n[' + source.source.name + '](https://www.duellinksmeta.com/sets/' + encodeURIComponent(source.source.name) + ')'
                        break;
                    case 'otherSources':
                        dltext += '\n' + source.source.name
                        break;
                }
            }
        }

        if (mdcard && mdcard.rarity) {
            mdtext += '**Rarity:** ' + emojis.rarity.MD[mdcard.rarity]

            switch (mdcard.banStatus) {
                case 'Forbidden':
                    mdtext += '\n**Status:** ' + emojis.lflist[mdcard.banStatus] + ' Forbidden'
                    break;
                case 'Limited 1':
                    mdtext += '\n**Status:** ' + emojis.lflist[mdcard.banStatus] + ' Limited'
                    break;
                case 'Limited 2':
                    mdtext += '\n**Status:** ' + emojis.lflist[mdcard.banStatus] + ' Semi-Limited'
                    break;
                case undefined:
                    mdtext += '\n**Status:** Unlimited'
                    break;           
            }
        }
        
        if (mdcard && mdcard.obtain && mdcard.obtain.length != 0) {
            mdtext += '\n\n**How to Obtain:**'
            for (const source of mdcard.obtain) {
                switch (source.type) {
                    case 'sets':
                        mdtext += '\n[' + source.source.name + '](https://www.masterduelmeta.com/articles/sets/' + encodeURIComponent(source.source.name).toLowerCase().replace(' ', '-') + ')'
                        break;
                    case 'otherSources':
                        mdtext += '\n' + source.source.name
                        break;
                }
            }
        }

        if ((dltext != '' || mdtext != '' || settext != '') && embedfields.length > 1) {
            embedfields.push({name: '​', value: '​'})
        }
        if (settext != '') {
            embedfields.push({name: 'Trading Card Game', value: settext, inline: false})
        }
        if (dltext != '') {
            embedfields.push({name: 'Duel Links', value: dltext, inline: true})
        }
        if (mdtext != '') {
            embedfields.push({name: 'Master Duel', value: mdtext, inline: true})
        }
    }

    var embed: MessageEmbedOptions = {
        footer: {
            text: ((!format || format === 'ocgtcg') ? 'ID: ' + cardinfo.id : 'Rush ID: ' + cardinfo.id)
        },
        title: cardinfo.name,
        url: 'https://yugipedia.com/wiki/' + encodeURIComponent(cardinfo.id),
        color: embedcolor,
        thumbnail: {
            url: ((!format || format === 'ocgtcg') ? 'https://images.ygoprodeck.com/images/cards_cropped/' + cardinfo.id + '.jpg' : 'https://images.ygoprodeck.com/images/cards/' + cardinfo.id + '.jpg')
        },
        description: ((cardinfo.attribute && emojis.attribute[cardinfo.attribute]) ?? emojis.type[cardinfo.type as keyof typeof emojis.type]) + (emojis.race[cardinfo.race as keyof typeof emojis.race] ?? '') + (cardinfo.type.includes('Tuner') ? emojis.race['Tuner'] : '') + ' **' + ((cardinfo.attribute && cardinfo.attribute + '/' + cardinfo.race + ' ' + cardinfo.type) ?? cardinfo.race + ' ' + cardinfo.type) + '**' + ((leveltext != '') ? '\n' + leveltext : '') + ((tradban !== '') ? tradban : ''),
        fields: embedfields
    }
    return ctx.send({embeds: [embed]})
}

export async function searchSet (query: string, ctx: CommandContext, game: 'dl' | 'md') {
    let setresult: DLMSet | undefined;

    switch (game) {
        case 'dl':
            setresult = await DLM.searchSet(query);
            break;
        case 'md':
            setresult = await MDM.searchSet(query);
            break;
    };

    if (setresult === undefined) {
        // do something, exit
        return ctx.send({content: 'The set you searched for turned up as undefined in our search.\nEither you misspelled your input, or DLM Corp. doesn\'t currently have information on this set.\nIf you suspect it\'s something else, please try again.', ephemeral: true})
    }

    let embedfields: Array<EmbedField> = [];

    let embedcolor = 0x000000;

    let iconTypes = getTypeForId(getIdForCardName(setresult.icon.name))
    const matchers: Array<[(types: string[]) => boolean, number]> = [
        [types => types.includes('TYPE_LINK'), 0x0685CC],
        [types => types.includes('TYPE_XYZ'), 0x161616],
        [types => types.includes('TYPE_SYNCHRO'), 0xE7E6E4],
        [types => types.includes('TYPE_FUSION'), 0x8E3E9D],
        [types => types.includes('TYPE_RITUAL'), 0x476FB5],
        [types => types.includes('TYPE_PENDULUM'), 0x5CB8AD],
        [types => types.includes('TYPE_EFFECT'), 0xC75227],
        [types => types.includes('TYPE_SPELL'), 0x008B78],
        [types => types.includes('TYPE_TRAP'), 0xA5146F],
        [types => types.includes('TYPE_NORMAL'), 0xCC9A53],
        [types => types.includes('TYPE_TUNER'), 0x19813A]
    ];
    for (const [matcher, color] of matchers) {
        if (matcher(iconTypes)) {
            embedcolor = color;
            break;
        }
    }

    let setCards: DLMCard[] = await fetch((game === 'dl' ? 'https://www.duellinksmeta.com/api/v1/cards?obtain.source=' : 'https://www.masterduelmeta.com/api/v1/cards?obtain.source=') + setresult._id).then(e => e.json()) as DLMCard[];
    let URcards: string = setCards.filter(e => e.rarity === 'UR').map(e => e.name).sort().join('\n')
    let SRcards: string = setCards.filter(e => e.rarity === 'SR').map(e => e.name).sort().join('\n')
    let Rcards: string = setCards.filter(e => e.rarity === 'R').map(e => e.name).sort().join('\n')
    let Ncards: string = setCards.filter(e => e.rarity === 'N').map(e => e.name).sort().join('\n')

    embedfields.push({name: 'UR Cards', value: (URcards.length > 1024 ? 'There are too many UR cards in this pack to list here.' : URcards)})
    embedfields.push({name: 'SR Cards', value: (SRcards.length > 1024 ? 'There are too many UR cards in this pack to list here.' : SRcards)})
    embedfields.push({name: 'R Cards', value: (Rcards.length > 1024 ? 'There are too many R cards in this pack to list here.' : Rcards)})
    embedfields.push({name: 'N Cards', value: (URcards.length > 1024 ? 'There are too many N cards in this pack to list here.' : Ncards)})

    var embed: MessageEmbedOptions = {
        title: setresult.name,
        url: (game === 'dl' ? ('https://www.duellinksmeta.com/articles' + setresult.linkedArticle.url) : ('https://www.masterduelmeta.com/articles' + setresult.linkedArticle.url)),
        color: embedcolor,
        footer: {
            text: 'Released on'
        },
        timestamp: setresult.release,
        fields: embedfields,
        image: {
            url: 'https://s3.duellinksmeta.com' + setresult.bannerImage.replace(' ', '%20')
        }
    }

    return ctx.send({embeds: [embed]})
};