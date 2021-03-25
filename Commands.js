const Discord = require('discord.js');
const fs = require('fs');
const commands = require('./Commands.js');
function help() {
    return new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setAuthor('Fencer')
        .addFields(
            { name: '!help', value: 'To see avaiable commands' },
            { name: '!info', value: 'To show info about bot' },
            { name: '!rank @name', value: 'To display your rank and stats' },
            { name: '!coward', value: 'To not be included in the game' },
            { name: '!fighter', value: 'To be included in a game [if user used !coward before]' },
            { name: '!rules', value: 'To show the rules' },
            { name: '!delay <value>', value: 'To set new delay' },
            { name: 'Fencer-prefix <new prefix>', value: 'To set a new prefix' }
        )
}
function rank() {
    return;
}
function coward() {
    return;
}
function fighter() {
    return;
}
function rules() {
    return new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setAuthor('Rules')
        .addFields(
            { name: '#1', value: 'The game is played 24/7', inline: true },
            { name: '#2', value: 'No cheating/spamming the chat to get additional points', inline: true },
            { name: '#3', value: 'Be nice', inline: true },
        )
}
function info(guild) {
    let delay = commands.readDelay(guild)
    return new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setAuthor('Info')
        .addFields(
            {
                name: 'Description', value:
                    'The game is very simple. Each of you message has a small chance to be an insult to the bot. If the bot is insulted, he will dare you to fight him. You will have `' + delay + '` seconds to respond to his challege by reacting on his message with :fencer:. If you missclick, or you will run out of time, you will be called a Coward.'
            },
        )
}
function delay(guild, delay) {
    if (!isNaN(delay) && delay > 0) {
        let reply = writeDelay(guild, delay);
        console.log(reply);
        return reply;
    }
    else return 'You must set a valid delay';
}

function writeDelay(guild, delay) {
    let object;
    fs.readFile('./db/' + guild.name + '_' + guild.id + '.json', (err, data) => {
        if (err)
            return 'Error has occured, delay has not changed';
        object = JSON.parse(data);
        object.delay = delay;
        fs.writeFile('./db/' + guild.name + '_' + guild.id + '.json', JSON.stringify(object, null, 2), function writeJSON(err) {
            if (err)
                return 'Error has occured, delay has not changed';
        });
    });
    return 'Delay successfuly changed';
}

exports.readDelay = function (guild) {
    let object =
        fs.readFileSync('./db/' + guild.name + '_' + guild.id + '.json', { encoding: 'utf8', flag: 'r' },
            function (err, data) {
                if (err)
                    throw err;
            });
    console.log(JSON.parse(object).delay)
    return JSON.parse(object).delay;
}

exports.prefix = function (prefix, guild) {
    let object;
    fs.readFile('./db/' + guild.name + '_' + guild.id + '.json', (err, data) => {
        if (err) throw err;
        object = JSON.parse(data);
        object.prefix = prefix;
        fs.writeFile('./db/' + guild.name + '_' + guild.id + '.json', JSON.stringify(object, null, 2), function writeJSON(err) {
            if (err) return console.log(err);
        });
    });

}
exports.executeCommand = function (message) {
    let command = message.content.slice(1, message.content.length).split(' ');
    switch (command[0]) {
        case 'help':
            message.channel.send(help());
            break;
        case 'rank':

            break;
        case 'coward':

            break;
        case 'fighter':

            break;
        case 'info':
            message.channel.send(info(message.guild));
            break;
        case 'rules':
            message.channel.send(rules());
            break;
        case 'delay':
            message.channel.send(delay(message.guild, command[1]));
            break;
        default:
            message.channel.send('Wrong command, try `!help`');
            break;
    }
}
