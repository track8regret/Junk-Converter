import { CommandContext, MessageEmbedOptions, EmbedField } from 'slash-create';
import fetch from 'node-fetch';
import { YGOPRODeck, LinkMarker, Card as YPDCard } from '../utilities/ygoprodeck.js'
import { DuelLinksMeta, MasterDuelMeta, Card as DLMCard, Set as DLMSet } from '../utilities/duellinksmeta.js';
import { getIdForCardName, getTypeForId } from '../utilities/database-cache.js'

const emojis = {
    'type': {
        // Spell/Trap
        'Spell Card': '<:YGOSpell:1000239838357897267>',
        'Trap Card': '<:YGOTrap:1000239840777998366>'
    },
    'attribute': {
        // Monster Attributes
        'FIRE': '<:YGOFire:1000239826093744229>',
        'WATER': '<:YGOWater:1000239842384412792>',
        'EARTH': '<:YGOEarth:1000239819856822315>',
        'WIND': '<:YGOWind:1000239843256827934>',
        'LIGHT': '<:YGOLight:1000239829054914571>',
        'DARK': '<:YGODark:1000239815201140776>',
        'DIVINE': '<:YGODivine:1000239816891445358>'
    },
    'race': {
        // Monster Types
        'Aqua': '<:YGOAqua:1000239808729329694>',
        'Beast': '<:YGOBeast:1000239809694027796>',
        'Beast-Warrior': '<:YGOBeastWarrior:1000239810411233340>',
        'Creator-God': '<:YGOCreatorGod:1000239813217243227>',
        'Cyberse': '<:YGOCyberse:1000239814232248460>',
        'Dinosaur': '<:YGODinosaur:1000239816157429830>',
        'Divine-Beast': '<:YGODivineBeast:1000239817650618428>',
        'Dragon': '<:YGODragon:1000239818657243246>',
        'Fairy': '<:YGOFairy:1000239821530345522>',
        'Fiend': '<:YGOFiend:1000239825229713478>',
        'Fish': '<:YGOFish:1000239826689331222>',
        'Insect': '<:YGOInsect:1000239827947634859>',
        'Machine': '<:YGOMachine:1000239830191587348>',
        'Plant': '<:YGOPlant:1000239832213242037>',
        'Psychic': '<:YGOPsychic:1000239832917889034>',
        'Pyro': '<:YGOPyro:1000239833664462899>',
        'Reptile': '<:YGOReptile:1000239835203764344>',
        'Rock': '<:YGORock:1000239836508196985>',
        'Sea Serpent': '<:YGOSeaSerpent:1000239837640667266>',
        'Spellcaster': '<:YGOSpellcaster:1000239839075123240>',
        'Thunder': '<:YGOThunder:1000239839905587282>',
        'Warrior': '<:YGOWarrior:1000239841574924382>',
        'Winged Beast': '<:YGOWingedBeast:1000239843772743801>',
        'Wyrm': '<:YGOWyrm:1000239844896817173>',
        'Zombie': '<:YGOZombie:1000239845806981120>',
        // Spell/Trap Types
        'Normal': '<:YGONormal:1000239830929784943>',
        'Continuous': '<:YGOContinuous:1000239811245920416>',
        'Counter': '<:YGOCounter:1000239812504191086>',
        'Field': '<:YGOField:1000239822729908374>',
        'Quick-Play': '<:YGOQuickPlay:1000239834406846544>',
        'Ritual': '<:YGORitual:1000239836017475614>',
        'Equip': '<:YGOEquip:1000239820746006538>',
        // Miscellaneous Monster Types
        'Tuner': '<:YGOTuner:1010457769444376607>'
    },
    'level': {
        // Level or Rank
        'level': '<:YGOLevel:1000248438291701931>',
        'rank': '<:YGORank:1000248438950219909>',
        'link': '<:YGOLink:1001077307609448479>'
    }, 
    'scale': {
        // Pendulum Scales
        'left': '<:YGOPendulumL:1000263798264971274>',
        'right': '<:YGOPendulumR:1000263799183523900>'
    },
    'arrow': {
        // Link Arrows
        'true': {
            // If there is a Link Arrow in that spot
            'Top': '<:YGOLinkU:1000269959835947059>',
            'Bottom': '<:YGOLinkD:1000269956098838538>',
            'Left': '<:YGOLinkL:1000269958267281478>',
            'Right': '<:YGOLinkR:1000269958963527771>',
            'Top-Left': '<:YGOLinkUL:1000269960758702160>',
            'Top-Right': '<:YGOLinkUR:1000269961530454066>',
            'Bottom-Left': '<:YGOLinkDL:1000269956816048250>',
            'Bottom-Right': '<:YGOLinkDR:1000269957562646569>'
        },
        'false': {
            // If there isn't a Link Arrow in that spot
            'Top': '<:YGOLinkNU:1000274112557629450>',
            'Bottom': '<:YGOLinkND:1000274108703051846>',
            'Left': '<:YGOLinkNL:1000274111110578319>',
            'Right': '<:YGOLinkNR:1000274111865569400>',
            'Top-Left': '<:YGOLinkNUL:1000274113551683675>',
            'Top-Right': '<:YGOLinkNUR:1000274114365378611>',
            'Bottom-Left': '<:YGOLinkNDL:1000274109680324689>',
            'Bottom-Right': '<:YGOLinkNDR:1000274110426918942>'
        }
    },
    'rarity': {
        // Card rarities in games
        'DL': {
            // Duel Links rarities
            'N': '<:YGODLN:1001018080610242591>',
            'R': '<:YGODLR:1001018081834971207>',
            'SR': '<:YGODLSR:1001018082703192105>',
            'UR': '<:YGODLUR:1001018083491721336>'
        },
        'MD': {
            // Master Duel rarities
            'N': '<:YGOMDN:1001017002950926386>',
            'R': '<:YGOMDR:1001017020843827251>',
            'SR': '<:YGOMDSR:1001017035184148542>',
            'UR': '<:YGOMDUR:1001017050371727441>'
        }
    },
    'number': {
        // Generic number emotes for Link
        '0': ':zero:',
        '1': ':one:',
        '2': ':two:',
        '3': ':three:',
        '4': ':four:',
        '5': ':five:',
        '6': ':six:',
        '7': ':seven:',
        '8': ':eight:'
    },
    'lflist': {
        // Forbidden & Limited icons
        'Forbidden': '<:YGOForbidden:1001074112233484298>',
        'Banned': '<:YGOForbidden:1001074112233484298>',
        'Limited 1': '<:YGOLimited:1001074112967483483>',
        'Limited': '<:YGOLimited:1001074112967483483>',
        'Limited 2': '<:YGOSemiLimited:1001074113697292399>',
        'Semi-Limited': '<:YGOSemiLimited:1001074113697292399>'
    }
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
        return ctx.send('The card you searched for turned up as undefined in our search.\nUsually, this happens when YGOPRODeck doesn\'t have information on a card we list.\nIf you suspect it\'s something else, please try again.', {ephemeral: true})
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
        [cardinfo => cardinfo.type.includes('Normal'), 0xCC9A53],
        [cardinfo => cardinfo.type.includes('Tuner'), 0x19813A]
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

    if (dlcard && dlcard.rarity && format !== 'rush' || mdcard && mdcard.rarity && format !== 'rush') {
        let dltext = '';
        let mdtext = '';
        
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

        if (dltext != '' && mdtext != '') {
            if (embedfields.length > 1) {
                embedfields.push({name: '​', value: '​'})
            }
            embedfields.push({name: 'Duel Links', value: dltext, inline: true})
            embedfields.push({name: 'Master Duel', value: mdtext, inline: true})
        } else if (dltext != '' && mdtext === '') {
            if (embedfields.length > 1) {
                embedfields.push({name: '​', value: '​'})
            }
            embedfields.push({name: 'Duel Links', value: dltext, inline: true})
        } else if (dltext === '' && mdtext != '') {
            if (embedfields.length > 1) {
                embedfields.push({name: '​', value: '​'})
            }
            embedfields.push({name: 'Master Duel', value: mdtext, inline: true})
        }
    }

    var embed: MessageEmbedOptions = {
        footer: {
            text: ((!format || format === 'ocgtcg') ? 'ID: ' + cardinfo.id : 'Rush ID: ' + cardinfo.id)
        },
        title: cardinfo.name,
        url: 'https://ygoprodeck.com/card/?search=' + encodeURIComponent(cardinfo.id),
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
        return ctx.send('The set you searched for turned up as undefined in our search.\nEither you misspelled your input, or DLM Corp. doesn\'t currently have information on this set.\nIf you suspect it\'s something else, please try again.', {ephemeral: true})
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