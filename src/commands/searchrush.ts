import { SlashCommand, CommandOptionType, CommandContext, AutocompleteContext, InteractionContextType, ApplicationIntegrationType } from 'slash-create';
import { getFuzzyCardSearch } from '../utilities/database-cache.js';
import { searchCard } from '../utilities/searchutil.js';

export class SearchRushCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 'searchrush',
            description: 'Searches for a specific Yu-Gi-Oh! Rush Duel card by name.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'query',
                description: 'The card name you want to search for.',
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
        choices = getFuzzyCardSearch(ctx.options[ctx.focused], 'rush')
        return choices.map(choice => ({name: (choice.endsWith(' (Rush)') ? choice.replace(' (Rush)', '') : choice), value: choice})).slice(0, 15)
    }

    async run(ctx: CommandContext) {
        return await searchCard(ctx.options.query, ctx)
    }
}