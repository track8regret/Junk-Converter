import { SlashCommand, CommandOptionType, CommandContext, AutocompleteContext } from 'slash-create';
import { getFuzzySetSearch } from '../utilities/duellinksmeta.js';
import { searchSet } from '../utilities/searchutil.js';

export class DuelLinksSetCommand extends SlashCommand {
    constructor(creator: any) {
        super(creator, {
            name: 'dls',
            description: 'Searches for a specific Yu-Gi-Oh! Duel Links card set by name.',
            options: [{
                type: CommandOptionType.STRING,
                name: 'query',
                description: 'The set name you want to search for.',
                required: true,
                autocomplete: true
            }],
            deferEphemeral: true
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