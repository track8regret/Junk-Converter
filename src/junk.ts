import * as dotenv from 'dotenv'
dotenv.config()
import { SlashCreator, GatewayServer } from 'slash-create';
import { ActivityType, Client, Collection, GatewayDispatchEvents, GatewayIntentBits } from 'discord.js';
import { AutoPoster } from 'topgg-autoposter';
import url from 'url';
import { ConvertCommand } from './commands/convert.js';
import { InviteCommand } from './commands/invite.js';
import { VoteCommand } from './commands/vote.js';
import { SearchCommand } from './commands/search.js'
import { SearchRushCommand } from './commands/searchrush.js';
import { DuelLinksSetCommand } from './commands/duellinksset.js';
import { MasterDuelSetCommand } from './commands/masterduelset.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const { APP_ID, PUBLIC_KEY, TOKEN, TOP_GG } = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const creator = new SlashCreator({
    applicationID: APP_ID!,
    publicKey: PUBLIC_KEY,
    token: TOKEN,
    client
});
const ap = AutoPoster(TOP_GG!, client)

await creator
    .withServer(
    new GatewayServer(
        (handler) => client.ws.on(GatewayDispatchEvents.InteractionCreate, handler)
    )
    )
    .registerCommands([ConvertCommand, InviteCommand, VoteCommand, SearchCommand, SearchRushCommand, DuelLinksSetCommand, MasterDuelSetCommand])
    .on('commandError', (command, error) => console.error(`Command ${command.commandName}:`, error))
    .syncCommands()
    .syncCommandsIn('299680357840715786')

client.login(TOKEN);
client.on('ready', () => {
    console.log('Junk Converter online.')
    client.user?.setPresence({'status': 'online', 'afk': false, 'activities': [{'name': 'Ishizu Tearlament', 'type': ActivityType.Playing}]})
});

ap.on('posted', () => {
    console.log('Stats posted to Top.gg.')
})