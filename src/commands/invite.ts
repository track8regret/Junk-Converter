import { SlashCommand, CommandContext, InteractionContextType, ApplicationIntegrationType } from 'slash-create';
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);

export class InviteCommand extends SlashCommand {
  constructor(creator: any) {
    super(creator, {
      name: 'i',
      description: 'Gives information about Junk Converter, as well as an invite link.',
      deferEphemeral: true,
      contexts: [InteractionContextType.PRIVATE_CHANNEL, InteractionContextType.BOT_DM, InteractionContextType.GUILD],
      integrationTypes: [ApplicationIntegrationType.GUILD_INSTALL, ApplicationIntegrationType.USER_INSTALL]
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    return ctx.send({content: 'Junk Converter is a Discord bot coded in a mix of discord.js and slash-create for the purposes of converting Yu-Gi-Oh! decks between various digital deck formats. It also has the ability to search for cards, from both the OCG/TCG and Rush Duel.\nMade with :drop_of_blood:, :sweat_drops:, :droplet:, and :heart: by 8 and uwx.\n\nTo invite Junk Converter to your server, you can either click/tap on its user profile and select "Add to Server," or you can click the link below.\nhttps://discord.com/api/oauth2/authorize?client_id=990092946848223322&permissions=262144&scope=bot%20applications.commands\nIf you\'re having problems with Junk Converter, you can either let me know by joining my Discord server, or DMing me on Twitter @track8regret.\nhttps://discord.gg/2vMBrWf5uc\n<https://twitter.com/track8regret>\n\nYou can also contribute directly to Junk Converter by sending a pull request to our GitHub page.\nhttps://github.com/track8regret/Junk-Converter', 'ephemeral': true})
  }
}