import { SlashCommand, CommandOptionType, CommandContext, AutocompleteContext, InteractionContextType, ApplicationIntegrationType } from 'slash-create';
import { getFuzzySetSearch } from '../utilities/duellinksmeta.js';
import { searchSet } from '../utilities/searchutil.js';

export class DuelLinksSetCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 'setdl',
            description: 'Searches for a specific Yu-Gi-Oh! Duel Links card set by name.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'query',
                description: 'The set name you want to search for.',
                required: true,
                autocomplete: true
            }, {
                type: CommandOptionType.BOOLEAN,
                name: 'private',
                description: 'Optionally have the response only be visible to yourself, instead of everybody. False by default.',
                required: false
            }],
            contexts: [InteractionContextType.PRIVATE_CHANNEL, InteractionContextType.BOT_DM, InteractionContextType.GUILD],
            integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL, ApplicationIntegrationType.USER_INSTALL]
        })
    }

    async autocomplete(ctx: AutocompleteContext): Promise<any> {
        let choices: string[];
        choices = getFuzzySetSearch(ctx.options[ctx.focused], 'dl')
        return choices.map(choice => ({name: choice, value: choice})).slice(0, 15)
    }

    async run(ctx: CommandContext) {
        return await searchSet(ctx.options.query, ctx, 'dl')
    }
}