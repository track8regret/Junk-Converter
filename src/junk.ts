import path from 'path';
import fs from 'fs/promises';
import { SlashCreator, GatewayServer } from 'slash-create';
import { Client, Collection, Intents } from 'discord.js';
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

const { appid, publickey, token, topgg } = JSON.parse(await fs.readFile(path.join(__dirname, 'config.json'), 'utf8'));

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const creator = new SlashCreator({
    applicationID: appid,
    publicKey: publickey,
    token: token,
    client
});
const ap = AutoPoster(topgg, client)

await creator
    .withServer(
    new GatewayServer(
        (handler) => client.ws.on('INTERACTION_CREATE', handler)
    )
    )
    .registerCommands([ConvertCommand, InviteCommand, VoteCommand, SearchCommand, SearchRushCommand, DuelLinksSetCommand, MasterDuelSetCommand])
    .on('commandError', (command, error) => console.error(`Command ${command.commandName}:`, error))
    .syncCommands()
    .syncCommandsIn('299680357840715786')

client.login(token);
client.on('ready', () => {
    console.log('Junk Converter online.')
    client.user?.setPresence({'status': 'online', 'afk': false, 'activities': [{'name': 'Adventurer... Anything, Really', 'type': 'PLAYING'}]})
});

ap.on('posted', () => {
    console.log('Stats posted to Top.gg.')
})