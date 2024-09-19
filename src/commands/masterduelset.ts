import { SlashCommand, CommandOptionType, CommandContext, AutocompleteContext, InteractionContextType, ApplicationIntegrationType } from 'slash-create';
import { getFuzzySetSearch } from '../utilities/duellinksmeta.js';
import { searchSet } from '../utilities/searchutil.js';

export class MasterDuelSetCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 'mds',
            description: 'Searches for a specific Yu-Gi-Oh! Master Duel card set by name.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'query',
                description: 'The set name you want to search for.',
                required: true,
                autocomplete: true
            }],
            contexts: [InteractionContextType.PRIVATE_CHANNEL, InteractionContextType.BOT_DM, InteractionContextType.GUILD],
            integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL, ApplicationIntegrationType.USER_INSTALL]
        })
    }

    async autocomplete(ctx: AutocompleteContext): Promise<any> {
        let choices: string[];
        choices = getFuzzySetSearch(ctx.options[ctx.focused], 'md')
        return choices.map(choice => ({name: choice, value: choice})).slice(0, 15)
    }

    async run(ctx: CommandContext) {
        return await searchSet(ctx.options.query, ctx, 'md')
    }
}