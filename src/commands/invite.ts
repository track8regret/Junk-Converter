import { SlashCommand, CommandContext } from 'slash-create';
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);

export class InviteCommand extends SlashCommand {
  constructor(creator: any) {
    super(creator, {
      name: 'invite',
      description: 'Tells you how to invite Junk Converter and gives you a link to do so.',
      deferEphemeral: true
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    return ctx.send('To invite Junk Converter, you can either click/tap on its user profile and select "Add to Server," or you can click the link below.\n\nhttps://discord.com/api/oauth2/authorize?client_id=990092946848223322&permissions=262144&scope=bot%20applications.commands', {'ephemeral': true})
  }
}