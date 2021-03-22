const Discord = require('discord.js');
const config = require('./config/config.js');
const client = new Discord.Client();
// database stuff
const fs = require('fs');
//fighting buffers
let currentOpponent = new Set();
let startTime = new Map();


client.once('ready', () => {
    console.log('Preparing for the fight...');
    console.log('Delay:', config.delay);

});

client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    checkIfDbExists(guild);
});

//When someone sends a message, try to fight him
client.on('message', function (message) {
    //just one figth per user at any given time
    if (!currentOpponent.has(message.author))
        figthMe(message);
});

//check if fight message had a reaction
client.on("messageReactionAdd", function (messageReaction, user) {
    if (currentOpponent.has(user))
        checkIfFoughtBack(messageReaction, user);
});

client.on('error', function (error) {
    console.error(`Client's WebSocket encountered a connection error: ${error}`);
});

process.on('SIGINT', function () {
    console.log("Caught interrupt signal");
    client.destroy();
    process.exit();
});

//-------------------functions-----------------------

function figthMe(message) {
    let fightProbability = Math.random();
    //dont react to own message
    if (message.author !== client.user) {
        if (fightProbability > 0.5) {
            currentOpponent.add(message.author);
            message.channel.send('Fight me <@' + message.member.id + '>!');
            startTime.set(message.author, new Date().getTime());
            setTimeout(function () {
                checkIfLost(message.author, message);
            }, (config.delay) * 1000);
        }
    }
}

function checkIfFoughtBack(messageReaction, user) {
    console.log('Checking if fighting');
    if (messageReaction.message.content.includes('Fight me')) {
        if (currentOpponent.has(user)) {
            if (messageReaction.emoji.identifier === '%F0%9F%A4%BA') {
                if (new Date().getTime() - (config.delay * 1000) <= startTime.get(user)) {
                    won(messageReaction, user);
                } else {
                    lostBecauseTime(messageReaction.message);
                }
            } else {
                console.log("Miss");
                lostBecauseMissClick(messageReaction, user);
            }
        }
    }
}

function setNicknameTo(me, nickname, opponent) {
    if (!me.hasPermission('MANAGE_NICKNAMES'))
        return console.log('I don\'t have permission to change your nickname!');
    //opponent.setNickname(nickname);
}

function checkIfLost(opponent, message) {
    if (currentOpponent.has(opponent) && opponent != null) {
        lostBecauseTime(message, opponent);
    }
}

function lostBecauseTime(message, opponent) {
    message.channel.send('<@' + opponent.id + '> was too slow!');
    setNicknameTo(message.guild.me, 'Coward', opponent);
    restart(opponent);
    addPoints(opponent, message.guild, false);
}

function lostBecauseMissClick(messageReaction, user) {
    console.log('Wrong emoji');
    messageReaction.message.channel.send('<@' + user.id + '> is that a missclick? Looks like you will be a coward...');
    setNicknameTo(messageReaction.message.guild.me, 'Coward', user);
    restart(user);
    addPoints(user, messageReaction.message.guild, false);
}

function won(messageReaction, user) {
    console.log('Fought back');
    messageReaction.message.channel.send('<@' + user.id + '> is not a coward!');
    restart(user);
    addPoints(user, messageReaction.message.guild, true);
}

function restart(user) {
    console.log('Restarting');
    startTime.delete(user);
    currentOpponent.delete(user);
}

function addPoints(user, guild, won) {
    fs.readFile('./db/' + guild.name + '.json', (err, data) => {
        if (err) throw err;
        let found = false;
        const object = JSON.parse(data);
        console.log(object);
        for (element in object.players) {
            if (element === user.id) {
                if (won) {
                    object.players[element].won++;
                } else {
                    object.players[element].lost++;
                }
                object.players[element] = {
                    username: object.players[element].username,
                    won: object.players[element].won,
                    lost: object.players[element].lost
                };
                found = true;
                console.log(object);
                break;
            }
        }
        if (!found) {
            let newWon = 0;
            let newLost = 0;
            if (won) {
                newWon = 1;
            } else {
                newLost = 1;
            }
            let newPlayer = {
                username: user.username,
                won: newWon,
                lost: newLost
            }
            object.players[user.id] = newPlayer;
        }
        fs.writeFile('./db/' + guild.name + '.json', JSON.stringify(object), function writeJSON(err) {
            if (err) return console.log(err);
            console.log('Writing to ' + './db/' + guild.name + '.json');
        });
    });
}

/**
 * Checks if json file exists, if not, it will create one with the correect structure of json
 */
function checkIfDbExists(guild) {
    console.log(guild.name);
    fs.readFile('./db/' + guild.name + '.json', (err, data) => {
        if (err) {
            const players = {}
            const json = {
                name: guild.name,
                id: guild.id,
                joined: guild.joinedAt,
                owner: guild.owner,
                players: players
            };
            const jsonString = JSON.stringify(json);
            fs.appendFile('./db/' + guild.name + '.json', jsonString, function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
        }
    });
}

client.login(config.token);
