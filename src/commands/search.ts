import { SlashCommand, CommandOptionType, CommandContext, AutocompleteContext, ApplicationIntegrationType, InteractionContextType } from 'slash-create';
import { getFuzzyCardSearch } from '../utilities/database-cache.js';
import { searchCard } from '../utilities/searchutil.js';

export class SearchCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 's',
            description: 'Searches for a specific Yu-Gi-Oh! card by name or card ID.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'query',
                description: 'The card name or ID you want to search for.',
                required: true,
                autocomplete: true,
            }, {
                type: CommandOptionType.BOOLEAN,
                name: 'acquisition',
                description: 'Optionally show information on where the card can be found in the TCG, Duel Links, and Master Duel.',
                required: false
            }],
            contexts: [InteractionContextType.PRIVATE_CHANNEL, InteractionContextType.BOT_DM, InteractionContextType.GUILD],
            integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL, ApplicationIntegrationType.USER_INSTALL]
        })
    }

    async autocomplete(ctx: AutocompleteContext): Promise<any> {
        let choices: string[];
        choices = getFuzzyCardSearch(ctx.options[ctx.focused], 'ocgtcg')
        return choices.map(choice => ({name: choice, value: choice})).slice(0, 15)
    }

    async run(ctx: CommandContext) {
        return await searchCard(ctx.options.query, ctx)
    }
}