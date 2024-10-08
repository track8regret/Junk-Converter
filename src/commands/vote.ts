import { SlashCommand, CommandContext, InteractionContextType, ApplicationIntegrationType } from 'slash-create';
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);

export class VoteCommand extends SlashCommand {
  constructor(creator: any) {
    super(creator, {
      name: 'vote',
      description: 'Provides a link to vote for Junk Converter on Top.gg.',
      deferEphemeral: true,
      contexts: [InteractionContextType.PRIVATE_CHANNEL, InteractionContextType.BOT_DM, InteractionContextType.GUILD],
      integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL, ApplicationIntegrationType.USER_INSTALL]
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    return ctx.send({content: 'While it serves to gain you no reward in comparison to other bots, voting for Junk Converter on Top.gg will greatly help with promoting the bot and making sure that other individuals are able to find it when searching for a tool like this.\nYour vote would be greatly appreciated.\n\nhttps://top.gg/bot/990092946848223322/vote', 'ephemeral': true})
  }
}