import { SlashCommand, CommandOptionType, ComponentType, TextInputStyle, CommandContext, AutocompleteContext, MessageEmbedOptions, EmbedField } from 'slash-create';
import { getCardNameForId, getIdForCardName, getFuzzySearch } from '../utilities/database-cache.js';
import { searchYPDByName, searchYPDByID, LinkMarker, Card as YPDCard } from '../utilities/ygoprodeck.js'
import { searchDLMByName, searchMDMByName, searchDLMByID, searchMDMByID, Card as DLMCard } from '../utilities/duellinksmeta.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';

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
        'Equip': '<:YGOEquip:1000239820746006538>'
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
        'Limited 1': '<:YGOLimited:1001074112967483483>',
        'Limited 2': '<:YGOSemiLimited:1001074113697292399>'
    }
}

export class CardCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 'card',
            description: 'Searches for a specific Yu-Gi-Oh! card by name or card ID.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'format',
                description: 'The Yu-Gi-Oh format you want information for.',
                required: true,
                choices: [{
                    name: 'OCG/TCG',
                    value: 'ocgtcg'
                }, {
                    name: 'Rush',
                    value: 'rush'
                }]
            }, {
                type: CommandOptionType.STRING,
                name: 'query',
                description: 'The card name or ID you want to search for.',
                required: true,
                autocomplete: true
            }],
            deferEphemeral: true
        })
    }

    async autocomplete(ctx: AutocompleteContext): Promise<any> {
        let choices: string[];
        if (!ctx.options.format || ctx.options.format === 'ocgtcg') {
            choices = getFuzzySearch(ctx.options[ctx.focused], 'ocgtcg')
        } else {
            choices = getFuzzySearch(ctx.options[ctx.focused], 'rush')
        }
        return choices.map(choice => ({name: (choice.endsWith(' (Rush)') ? choice.replace(' (Rush)', '') : choice), value: choice})).slice(0, 15)
    }

    async run(ctx: CommandContext) {
        let cardinfo: YPDCard | undefined;
        let dlcard: DLMCard | undefined;
        let mdcard: DLMCard | undefined;
        if (!isNaN(Number(ctx.options.query))) {
            if (!ctx.options.format || ctx.options.format === 'ocgtcg') {
                cardinfo = await searchYPDByID(Number(ctx.options.query));
                dlcard = await searchDLMByID(Number(ctx.options.query));
                mdcard = await searchMDMByID(Number(ctx.options.query));
            } else {
                cardinfo = await searchYPDByID(Number(ctx.options.query), 'rush');
                dlcard = undefined;
                mdcard = undefined;
            }
        } else {
            if (!ctx.options.format || ctx.options.format === 'ocgtcg') {
                cardinfo = await searchYPDByName(ctx.options.query)
                dlcard = await searchDLMByName(ctx.options.query)
                mdcard = await searchMDMByName(ctx.options.query)
            } else {
                cardinfo = await searchYPDByName((ctx.options.query.endsWith(' (Rush)') ? ctx.options.query.replace(' (Rush)', ' (Rush Duel)') : ctx.options.query), 'rush');
                dlcard = undefined;
                mdcard = undefined;
            }
        }

        if (cardinfo === undefined) {
            // do something, exit
            return ctx.send('The card you searched for turned up as undefined in our search.\nUsually, this happens when YGOPRODeck doesn\'t have information on a card we list.\nIf you suspect it\'s something else, please try again.', {ephemeral: true})
        }

        let embedfields: Array<EmbedField> = [];

        if (!ctx.options.format || ctx.options.format === 'ocgtcg' || ctx.options.format === 'rush' && !cardinfo.desc.includes('[REQUIREMENT]')) {
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

        if (ctx.options.format === 'rush' && cardinfo.desc.includes('[REQUIREMENT]')) {
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

        if (dlcard && dlcard.rarity && ctx.options.format !== 'rush' || mdcard && mdcard.rarity && ctx.options.format !== 'rush') {
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
                            mdtext += '\n[' + source.source.name + '](https://www.masterduelmeta.com/articles/sets/' + encodeURIComponent(source.source.name) + ')'
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
                text: ((!ctx.options.format || ctx.options.format === 'ocgtcg') ? 'ID: ' + cardinfo.id : 'Rush ID: ' + cardinfo.id)
            },
            title: cardinfo.name,
            url: 'https://ygoprodeck.com/card/?search=' + encodeURIComponent(cardinfo.id),
            color: embedcolor,
            thumbnail: {
                url: ((!ctx.options.format || ctx.options.format === 'ocgtcg') ? 'https://images.ygoprodeck.com/images/cards_cropped/' + cardinfo.id + '.jpg' : 'https://images.ygoprodeck.com/images/cards/' + cardinfo.id + '.jpg')
            },
            description: ((cardinfo.attribute && emojis.attribute[cardinfo.attribute]) ?? emojis.type[cardinfo.type as keyof typeof emojis.type]) + (emojis.race[cardinfo.race as keyof typeof emojis.race] ?? '') + ' **' + ((cardinfo.attribute && cardinfo.attribute + '/' + cardinfo.race + ' ' + cardinfo.type) ?? cardinfo.race + ' ' + cardinfo.type) + '**' + ((leveltext != '') ? '\n' + leveltext : ''),
            fields: embedfields
        }
        return ctx.send({embeds: [embed]})
    }
}