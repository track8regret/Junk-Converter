import { SlashCommand, CommandOptionType, CommandContext, AutocompleteContext } from 'slash-create';
import { getFuzzySearch } from '../utilities/database-cache.js';
import { searchCard } from '../utilities/searchutil.js';

export class SearchRushCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 'sr',
            description: 'Searches for a specific Yu-Gi-Oh! Rush Duel card by name or card ID.',
            options: [{
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
        choices = getFuzzySearch(ctx.options[ctx.focused], 'rush')
        return choices.map(choice => ({name: (choice.endsWith(' (Rush)') ? choice.replace(' (Rush)', '') : choice), value: choice})).slice(0, 15)
    }

    async run(ctx: CommandContext) {
        return await searchCard(ctx.options.query, ctx, 'rush')
    }
}