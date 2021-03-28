const Discord = require('discord.js');
const config = require('./config/config.js');
const client = new Discord.Client();
const commands = require('./Commands.js');
// database stuff
const fs = require('fs');
//fighting buffers
let currentOpponent = new Set();
let startTime = new Map();



//-------------------events-------------------------
client.once('ready', () => {
    console.log('Preparing for the fight...');
    client.guilds.cache.each(guild => checkIfDatabaseExists(guild)); //check if db exists
});

client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    createDatabase(guild);
});

client.on('message', function (message) {
    if (message.author === client.user) {
        //dont react to own message
        return;
    }
    if (message.content.startsWith(checkPrefix(message.guild))) { //command
        commands.executeCommand(message);
    } else if (message.content.startsWith('Fencer-prefix')) {
        commands.prefix(message);    //change prefix
    } else if (!currentOpponent.has(message.author) && isPlaying(message)) { //just one figth per user at any given time
        figthMe(message);
    }
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

function isPlaying(message) {
    let object =
        fs.readFileSync('./db/' + message.guild.name + '_' + message.guild.id + '.json', { encoding: 'utf8', flag: 'r' },
            function (err, data) {
                if (err)
                    throw err;
            });
    return findPlayerForPlaying(message.author, JSON.parse(object));
}

function findPlayerForPlaying(user, object) {
    for (element in object.players) {
        if (element === user.id) {
            return object.players[element].playing; //status of a player
        }
    }
    return true;    //player not found in db, therefore playing (this will add a record for this player)
}

function figthMe(message) {
    let fightProbability = Math.random();
    if (fightProbability > 0.5) {
        currentOpponent.add(message.author);
        message.channel.send('Fight me <@' + message.member.id + '>!');
        startTime.set(message.author, new Date().getTime());
        setTimeout(function () {
            checkIfLost(message.author, message);
        }, (commands.readDelay(message.guild)) * 1000);
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
                console.log('Miss');
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
    let data =
        fs.readFileSync('./db/' + guild.name + '_' + guild.id + '.json', (err, data) => {
            if (err) throw err;
        });
    let object = JSON.parse(data);
    addToPlayer(object, user, won);
    fs.writeFileSync('./db/' + guild.name + '_' + guild.id + '.json', JSON.stringify(object, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
        console.log('Writing to ' + './db/' + guild.name + '_' + guild.id + '.json');
    });
}

function addToPlayer(object, user, won) {
    for (element in object.players) {
        if (element === user.id) {
            if (won) {
                object.players[element].won++;
            } else {
                object.players[element].lost++;
            }
            return;
        }
    }
    createPlayer(object, user, won);
}

function createPlayer(object, user, won) {
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
        lost: newLost,
        playing: true
    }
    object.players[user.id] = newPlayer;
}

/**
 * Checks if json file exists, if not, it will create one with the correect structure of json
 */
function createDatabase(guild) {
    console.log(guild.name);
    const players = {}
    const json = {
        name: guild.name,
        id: guild.id,
        joined: guild.joinedAt,
        owner: guild.owner,
        prefix: '!',
        delay: 5,
        players: players
    };
    const jsonString = JSON.stringify(json, null, 2);
    fs.writeFileSync('./db/' + guild.name + '_' + guild.id + '.json', jsonString, function (err) {
        if (err) throw err;
        console.log('Updated!');
    });
}

function checkPrefix(guild) {
    let object =
        fs.readFileSync('./db/' + guild.name + '_' + guild.id + '.json', { encoding: 'utf8', flag: 'r' },
            function (err, data) {
                if (err)
                    throw err;
            });
    return JSON.parse(object).prefix;
}

function checkIfDatabaseExists(guild) {
    let path = './db/' + guild.name + '_' + guild.id + '.json';
    // See if the file exists
    try {
        if (fs.existsSync(path)) {
            console.log('Db exists ' + guild.name);
        } else {
            console.log('No db found ' + guild.name);
            createDatabase(guild);
        }
    } catch (err) {
        console.log(err);
    }
}

client.login(config.token);
