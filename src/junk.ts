// import everything we need
import * as dotenv from 'dotenv'
dotenv.config()
import { SlashCreator, GatewayServer } from 'slash-create';
import { ActivityType, Client, Collection, GatewayDispatchEvents, GatewayIntentBits } from 'discord.js';
import { AutoPoster } from 'topgg-autoposter';
import { ConvertCommand } from './commands/convert.js';
import { InviteCommand } from './commands/invite.js';
import { VoteCommand } from './commands/vote.js';
import { SearchCommand } from './commands/search.js'
import { SearchRushCommand } from './commands/searchrush.js';
import { DuelLinksSetCommand } from './commands/duellinksset.js';
import { MasterDuelSetCommand } from './commands/masterduelset.js';

// grab dotenv variables
const { APP_ID, PUBLIC_KEY, TOKEN, TOP_GG, TEST_SERVER } = process.env;

// make the client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const creator = new SlashCreator({
    applicationID: APP_ID!,
    publicKey: PUBLIC_KEY,
    token: TOKEN,
    client
});

// set up topgg autoposter
const ap = AutoPoster(TOP_GG!, client)

await creator
    .withServer(
    new GatewayServer(
        (handler) => client.ws.on(GatewayDispatchEvents.InteractionCreate, handler)
    )
    )
    .registerCommands([ConvertCommand, InviteCommand, VoteCommand, SearchCommand, SearchRushCommand, DuelLinksSetCommand, MasterDuelSetCommand]) // register commands
    .on('commandError', (command, error) => console.error(`Command ${command.commandName}:`, error))
    .syncCommands()
    .syncCommandsIn(TEST_SERVER!)

client.login(TOKEN);
client.on('ready', () => {
    console.log('Junk Converter online.')
    client.user?.setPresence({'status': 'online', 'afk': false, 'activities': [{'name': 'Ishizu Tearlament', 'type': ActivityType.Playing}]})
});

ap.on('posted', () => {
    console.log('Stats posted to Top.gg.')
})