const Discord = require('discord.js');
const client = new Discord.Client();
const token = '';

const MAX_SEC = 10;

var currentOpponent = null;
var startTime;


client.once('ready', () => {
    console.log('Preparing for the fight...');
});

//When someone sends a message, try to fight him
client.on('message', function (message) {
    figthMe(message);
});

//check if fight message had a reaction
client.on("messageReactionAdd", function (messageReaction, user) {
    checkIfFoughtBack(messageReaction, user);
});

client.on('error', function (error) {
    console.error(`Client's WebSocket encountered a connection error: ${error}`);
});

//-------------------functions-----------------------

function figthMe(message) {
    if (currentOpponent != null) {
        return;
    }
    var fightProbability = Math.random();
    //dont react to own message
    if (message.author.client != client.user) {
        if (fightProbability > 0.5) {
            console.log('Fighting');
            currentOpponent = message.member;
            message.channel.send('Fight me <@' + currentOpponent.id + '>!');
            startTime = new Date().getTime();
            setTimeout(function () { checkIfLost(currentOpponent, message.channel); }, MAX_SEC * 1000);
        }
    }
}

function checkIfFoughtBack(messageReaction, user) {
    console.log('Checking if fighting');
    if (messageReaction.message.content === 'Fight me!') {
        if (user.id === currentOpponent.id) {
            if (messageReaction.emoji.identifier === '%F0%9F%A4%BA') {
                if (new Date().getTime() - (MAX_SEC * 1000) <= startTime) {
                    won(messageReaction);
                } else {
                    lostBecauseTime(messageReaction.message.channel);
                }
            } else {
                lostBecauseMissClick(messageReaction);
            }
        }
    }
}

function setNicknameTo(nickname, opponent) {

}

function checkIfLost(opponent, channel) {
    if (opponent === currentOpponent && opponent != null) {
        lostBecauseTime(channel, opponent);
    }
}

function lostBecauseTime(channel, opponent) {
    channel.send('<@' + opponent.id + '> was too slow!');
    currentOpponent = null;
}

function lostBecauseMissClick(messageReaction) {
    console.log('Wrong emoji');
    messageReaction.message.channel.send('<@' + currentOpponent.id + '> is that a missclick? Looks like you will be a coward...');
    setNicknameTo('Coward', currentOpponent);
    currentOpponent = null;
}

function won(messageReaction) {
    console.log('Fought back');
    messageReaction.message.channel.send('<@' + currentOpponent.id + '> is not a coward!');
    currentOpponent = null;
}

function restart() {
    currentOpponent = null;
    startTime = 0;
}

//has to be last line
client.login(token);
