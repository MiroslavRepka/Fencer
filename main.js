const Discord = require('discord.js');
const client = new Discord.Client();
const token = 'ODE2MjQ0Njc0NjE1NTc0NTM5.YD4JFw.v2IzHmiH-KX4n5rqKKwhoZp4j-k';

var currentOpponent = null;


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
    if (message.author != client.user) {
        //10% chance to fight
        if (fightProbability > 0.5) {
            console.log('Fighting');
            message.channel.send('Fight me!');
            currentOpponent = message.author;
        }
    }
}

function checkIfFoughtBack(messageReaction, user) {
    console.log('Checking if fighting');
    if (messageReaction.message.content === 'Fight me!') {
        if (user === currentOpponent) {
            if (messageReaction.emoji.identifier === '%F0%9F%A4%BA') {
                console.log('Fought back');
                messageReaction.message.channel.send('<@' + currentOpponent.id + '> is not a coward');
                currentOpponent = null;
            } else {
                console.log('Wrong emoji');
                messageReaction.message.channel.send('<@' + currentOpponent.id + '> is that a missclick? Looks like you will be a coward...');
                currentOpponent = null;
                setNicknameTo('Coward');
            }
        }
    }
}

function setNicknameTo(nickname) {

}

//has to be last line
client.login(token);