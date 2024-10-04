import { SlashCommand, CommandOptionType, ComponentType, TextInputStyle, CommandContext, ModalSendableContext, ModalOptions, MessageFile, ModalInteractionContext, InteractionContextType, ApplicationIntegrationType } from 'slash-create';
import { Deck, Encoder, YDKEncoder, YDKeEncoder, OmegaEncoder, NamelistEncoder, KonamiEncoder, JSONEncoder } from '../utilities/encoders.js'
import url from 'url';
import fetch from 'node-fetch';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;
const __filename = url.fileURLToPath(import.meta.url);

function sendModalAndGetValues(ctx: ModalSendableContext, options: ModalOptions): Promise<ModalInteractionContext> {
    return new Promise((resolve, reject) => {
        ctx.sendModal(options, mctx => {
            resolve(mctx);
        });
    })
}

export class ConvertCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 'convert',
            description: 'Converts a Yu-Gi-Oh deck from one format to another.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'from',
                description: 'The format you\'re converting the deck from.',
                required: true,
                choices: [{
                    name: 'YDK',
                    value: 'Convert from a .YDK file.'
                }, {
                    name: 'YDKe',
                    value: 'Convert from a YDKe string.'
                }, {
                    name: 'Omega',
                    value: 'Convert from an Omega string.'
                }, {
                    name: 'Namelist',
                    value: 'Convert from a list of card names.'
                }, {
                    name: 'JSON',
                    value: 'Convert from a .JSON file.'
                }, {
                    name: 'Konami',
                    value: 'Convert from a deck URL from the official Konami database.'
                }, {
                    name: 'YGOPRODeck',
                    value: 'Convert from a deck URL from the YGOPRODeck website.'
                }]
            }, {
                type: CommandOptionType.STRING,
                name: 'to',
                description: 'The format you\'re converting the deck from.',
                required: true,
                choices: [{
                    name: 'YDK',
                    value: 'Convert to a .YDK file.'
                }, {
                    name: 'YDKe',
                    value: 'Convert to a YDKE string.'
                }, {
                    name: 'Omega',
                    value: 'Convert to an Omega string.'
                }, {
                    name: 'Namelist',
                    value: 'Convert to a list of card names.'
                }, {
                    name: 'JSON',
                    value: 'Convert to a .JSON file.'
                }]
            }, {
                type: CommandOptionType.ATTACHMENT,
                name: 'file',
                description: 'The file you want to convert. Only relevant when converting from YDK or JSON.'
            }, {
                type: CommandOptionType.STRING,
                name: 'name',
                description: 'The name you want the deck to output with. Only relevant when converting to YDK or JSON.'
            }, {
                type: CommandOptionType.BOOLEAN,
                name: 'private',
                description: 'Optionally have the response only be visible to yourself, instead of everybody. False by default.',
                required: false
            }],
            contexts: [InteractionContextType.PRIVATE_CHANNEL, InteractionContextType.BOT_DM, InteractionContextType.GUILD],
            integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL, ApplicationIntegrationType.USER_INSTALL]
        });
        this.filePath = __filename;
    };

    async run(ctx: CommandContext) {
        let deck: Deck | null = null;
        let modal: ModalInteractionContext | null = null;
        let emptyDeck: Deck = new Deck([], [], []);

        switch (ctx.options.from) {
            case 'Convert from a .YDK file.':
                var deckurl = ctx.attachments.first()?.url
                if (!deckurl) {
                    return ctx.send({content: 'You need to attach the YDK file you want to convert with the "file" option. Please try again.', ephemeral: true })
                }
                if (!deckurl.endsWith('.ydk')) {
                    return ctx.send({content: 'The file you submitted was not a YDK file. Please try again.', ephemeral: true })
                }
                var ydkfile = await fetch(deckurl).then(e => e.text());
                const ydkdecoder = new YDKEncoder();
                deck = await ydkdecoder.decode(ydkfile)
                break;
            case 'Convert from a YDKe string.':
                var mctx = await sendModalAndGetValues(ctx, {
                    title: 'Junk Converter',
                    components: [{
                        type: ComponentType.ACTION_ROW,
                        components: [{
                            type: ComponentType.TEXT_INPUT,
                            label: 'YDKe Link',
                            style: TextInputStyle.SHORT,
                            custom_id: 'ydkein',
                            placeholder: 'ydke://'
                        }]
                    }]
                });
                modal = mctx;
                if (!mctx.values.ydkein.startsWith('ydke://')) {
                    return mctx.send({content: 'The URI you entered was not for a YDKe. Please try again.', ephemeral: true })
                }
                var ydkedecoder = new YDKeEncoder();
                deck = await ydkedecoder.decode(mctx.values.ydkein);
                break;
            case 'Convert from an Omega string.':
                var mctx = await sendModalAndGetValues(ctx, {
                    title: 'Junk Converter',
                    components: [{
                        type: ComponentType.ACTION_ROW,
                        components: [{
                            type: ComponentType.TEXT_INPUT,
                            label: 'Omega Code',
                            style: TextInputStyle.SHORT,
                            custom_id: 'omegain',
                            placeholder: 'Omega code...'
                        }]
                    }]
                });
                modal = mctx;
                var omegadecoder = new OmegaEncoder();
                deck = await omegadecoder.decode(mctx.values.omegain);
                break;
            case 'Convert from a list of card names.':
                var mctx = await sendModalAndGetValues(ctx, {
                    title: 'Junk Converter',
                    components: [{
                        type: ComponentType.ACTION_ROW,
                        components: [{
                            type: ComponentType.TEXT_INPUT,
                            label: 'Deck List',
                            style: TextInputStyle.PARAGRAPH,
                            custom_id: 'namelistin',
                            placeholder: '3 Time Wizard...'
                        }]
                    }]
                });
                modal = mctx;
                var namelistdecoder = new NamelistEncoder();
                deck = await namelistdecoder.decode(mctx.values.namelistin);
                break;
            case 'Convert from a .JSON file.':
                var deckurl = ctx.attachments.first()?.url
                if (!deckurl) {
                    return ctx.send('You need to attach the JSON file you want to convert with the "file" option.')
                }
                if (!deckurl.endsWith('.json')) {
                    return ctx.send({content: 'The file you submitted was not a JSON file. Please try again.', ephemeral: true })
                }
                var jsonfile = await fetch(deckurl).then(e => e.text());
                const jsondecoder = new JSONEncoder();
                deck = await jsondecoder.decode(jsonfile)
                break;
            case 'Convert from a deck URL from the official Konami database.':
                var mctx = await sendModalAndGetValues(ctx, {
                    title: 'Junk Converter',
                    components: [{
                        type: ComponentType.ACTION_ROW,
                        components: [{
                            type: ComponentType.TEXT_INPUT,
                            label: 'Konami URL',
                            style: TextInputStyle.SHORT,
                            custom_id: 'konamiin',
                            placeholder: 'https://www.db.yugioh-card.com/yugiohdb/member_deck.action?cgid='
                        }]
                    }]
                });
                modal = mctx;

                if (!mctx.values.konamiin.startsWith('https://www.db.yugioh-card.com/yugiohdb/member_deck.action?cgid=') || !mctx.values.konamiin.startsWith('http://www.db.yugioh-card.com/yugiohdb/member_deck.action?cgid=')) {
                    return mctx.send({content: 'Normally, you would see this error message when you put in a link to Konami\'s database incorrectly.\nHowever, our ability to convert from Konami\'s database is currently broken.\nWe deeply apologise for the inconvenience, and strive to have it operational again soon.', ephemeral: true })
                    // 'The URL you entered either isn\'t from Konami\'s database, or was entered incorrectly.\nPlease try again.'
                }

                var konamidecoder = new KonamiEncoder();
                deck = await konamidecoder.decode(mctx.values.konamiin);
                break;
            case 'Convert from a deck URL from the YGOPRODeck website.':
                var mctx = await sendModalAndGetValues(ctx, {
                    title: 'Junk Converter',
                    components: [{
                        type: ComponentType.ACTION_ROW,
                        components: [{
                            type: ComponentType.TEXT_INPUT,
                            label: 'YGOPRODeck URL',
                            style: TextInputStyle.SHORT,
                            custom_id: 'ypdin',
                            placeholder: 'https://ygoprodeck.com/deck/'
                        }]
                    }]
                });
                modal = mctx;

                if (!mctx.values.ypdin.startsWith('https://ygoprodeck.com/deck/')) {
                    return mctx.send({content: 'The URL you entered either isn\'t from YGOPRODeck, or was input incorrectly.\nPlease try again.', ephemeral: true })
                }

                var page = await fetch(mctx.values.ypdin).then(e => e.text());
                var dom = new JSDOM(page);

                // Find the right script tag
                const scriptContents = [...dom.window.document.querySelectorAll('script')]
                    .map(e => e.textContent)
                    .filter(e => e !== null)
                    .find(e => /var maindeckjs = /.test(e!));
                
                if (!scriptContents) {
                    return mctx.send('The YGOPRODeck URL you submitted doesn\'t exist. Please try again.')
                }

                let ypdmain: number[];
                let ypdextra: number[];
                let ypdside: number[];

                // Evaluate script variables and get their parsed values
                var maindeckjs: string[] = JSON.parse(eval((scriptContents.match(/var maindeckjs = (.*);/m)![1])));
                var extradeckjs: string[] | null = JSON.parse(eval((scriptContents.match(/var extradeckjs = (.*);/m)![1])));
                var sidedeckjs: string[] | null = JSON.parse(eval((scriptContents.match(/var sidedeckjs = (.*);/m)![1])));

                ypdmain = maindeckjs.map(Number)

                if (extradeckjs === null) {
                    ypdextra = [];
                } else {
                    ypdextra = extradeckjs.map(Number)
                }

                if (sidedeckjs === null) {
                    ypdside = [];
                } else {
                    ypdside = sidedeckjs.map(Number)
                }

                deck = new Deck(ypdmain, ypdextra, ypdside)
                break;
        };

        if (deck === null || deck === emptyDeck) {
            return ctx.send({content: 'You\'ve managed to do something that made the deck decode come out as being empty. Congratulations.', ephemeral: ctx.options['private']});
        }

        switch (ctx.options.to) {
            case 'Convert to a .YDK file.':
                var ydkencoder = new YDKEncoder();
                var result = await ydkencoder.encode(deck);

                var buffer = Buffer.from(result, 'utf8');
                var attachment = { file: buffer, name: (ctx.options.name ?? deck.deckName ?? 'result') + '.ydk' };

                if (modal) {
                    modal.send({content: 'Here\'s your converted YDK file:', files: [attachment], ephemeral: ctx.options['private']})
                } else {
                    ctx.send({content: 'Here\'s your converted YDK file:', files: [attachment], ephemeral: ctx.options['private']})
                }
                break;
            case 'Convert to a YDKE string.':
                var ydkeencoder = new YDKeEncoder();
                var result = await ydkeencoder.encode(deck);

                if (modal) {
                    modal.send({content: 'Here\'s your converted YDKe link:\n`' + result + '`', ephemeral: ctx.options['private']})
                } else {
                    ctx.send({content: 'Here\'s your converted YDKe link:\n`' + result + '`', ephemeral: ctx.options['private']})
                }
                break;
            case 'Convert to an Omega string.':
                var omegaencoder = new OmegaEncoder();
                var result = await omegaencoder.encode(deck);

                if (modal) {
                    modal.send({content: 'Here\'s your converted Omega code:\n`' + result + '`', ephemeral: ctx.options['private']})
                } else {
                    ctx.send({content: 'Here\'s your converted Omega code:\n`' + result + '`', ephemeral: ctx.options['private']})
                }
                break;
            case 'Convert to a list of card names.':
                var namelistencoder = new NamelistEncoder();
                var result = await namelistencoder.encode(deck);

                if (modal) {
                    modal.send({content: 'Here\'s your converted card name list:\n```' + result + '```', ephemeral: ctx.options['private']})
                } else {
                    ctx.send({content: 'Here\'s your converted card name list:\n```' + result + '```', ephemeral: ctx.options['private']})
                }
                break;
            case 'Convert to a .JSON file.':
                var jsonencoder = new JSONEncoder();
                var result = await jsonencoder.encode(deck);
                var buffer = Buffer.from(result, 'utf8');
                var attachment = { file: buffer, name: (ctx.options.name ?? deck.deckName ?? 'result') + '.json' };

                if (modal) {
                    modal.send({content: 'Here\'s your converted JSON file:', files: [attachment], ephemeral: ctx.options['private']})
                } else {
                    ctx.send({content: 'Here\'s your converted JSON file:', files: [attachment], ephemeral: ctx.options['private']})
                }
                break;
        }
    }
}