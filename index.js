
require("dotenv").config(); //to start process from .env file
const { Client, IntentsBitField: I, REST, Routes, Partials: P } = require('discord.js');
const client = new Client({
    intents: [
        I.Flags.Guilds,//adds server functionality
        I.Flags.GuildMessages, //gets messages from our bot.
        I.Flags.MessageContent,
        I.Flags.GuildMessageReactions
    ],
    partials: [ P.Message, P.Channel, P.Reaction ]
});
const prefix = '$';
let doneUsers = [];
let verifiedUsers = [];

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
    {
        name: 'list',
        description: "Lists the ARKS who completed weekly AQ"
    },
    {
        name: 'total',
        description: "Returns the total number of arks who have completed weekly AQ"
    },
    {
        name: 'clean',
        description: "Cleans the records"
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(process.env.APPLICATIONID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

/**
 * Generates users list
 * @returns List of user as a string
 */
const total = () => {
    return `The amount of ARKS completed this weeks AQ are: ${doneUsers.length}`;
};

const usersList = () => {
    const userList = doneUsers.join(', \n');
    return `The following ARKS have completed the AQ: \n${userList}`;
};

const clean = () => {
    doneUsers = [];
    verifiedUsers = [];

    return "Records emptied";
}

/**
 * Sends message
 * @param {Message<boolean>} socket 
 * @param {string} message 
 */
const sendMessage = (socket, message) => {
    socket.channel.send(message).catch((reason) => console.log(reason));
};

/**
 * Replies to an interaction
 * @param {ChatInputCommandInteraction<CacheType>} interaction 
 * @param {string} message 
 * @returns 
 */
const interactionReply = async (interaction, message) => {
    return await interaction.reply(message);
};

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
        case "ping":
            await interactionReply(interaction, 'PONG');
            break;
        case "list":
            await interactionReply(interaction, usersList());
            break;
        case "clean":
            await interactionReply(interaction, clean());
            break;
        case "total":
            await interactionReply(interaction, total());
            break;
        default:
            break;
    }
});

const homeWorkHandler = (message) => {
    if (!doneUsers.includes(message.author.username)) {
        doneUsers.push(message.author.username);
    }
    sendMessage(message, `Recorded ARKS : ${message.author.username}`);
}

client.on('messageReactionAdd', async (reaction, user) => {
    // Check that the reaction was added to a message the bot has access to
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error(`Could not fetch message: ${error}`);
            return;
        }
    }



    // Retrieve the name of the user who added the reaction
    const username = user.username;

    // Retrieve the ID of the channel the reaction was added in
    const channelID = reaction.message.channel.id;

    // Retrieve the ID of the message the reaction was added to
    const messageID = reaction.message.id;

    // Retrieve the name of the emoji that was added
    const emojiName = reaction.emoji.name === '👍' ? "Approved" : "Denied";

    // Send a response message
    const channel = client.channels.cache.get(channelID);
    const message = await channel.messages.fetch(messageID);
    message.channel.send(`${username} has ${emojiName} your submission.`);
});

client.on("messageCreate", async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "home_work":
            homeWorkHandler(message);
            break;
        case "current_progress":
            sendMessage(message, total());
            break;
        case "completed_arks":
            sendMessage(message, usersList());
            break;
        default:
            break;
    }
})



client.login(process.env.TOKEN);