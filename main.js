const Discord = require('discord.js');
const config = require('./config/config.js');
const client = new Discord.Client();
// database stuff
const firebase = require('./node_modules/firebase/app');
const FieldValue = require('./node_modules/firebase-admin').firestore.FieldValue;
const admin = require('./node_modules/firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');
//fighting buffers
let currentOpponent = new Set();
let startTime = new Map();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let db = admin.firestore();

client.once('ready', () => {
    console.log('Preparing for the fight...');
    console.log('Delay:', config.delay);

});

client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    checkIfDbExists(client.guilds);
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
                    restart(user);
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
    console.log('Opponent', opponent, '\n if ', currentOpponent.has(opponent));
    if (currentOpponent.has(opponent) && opponent != null) {
        lostBecauseTime(message, opponent);
    }
}

function lostBecauseTime(message, opponent) {
    message.channel.send('<@' + opponent.id + '> was too slow!');
    setNicknameTo(message.guild.me, 'Coward', opponent);
    restart(opponent);
}

function lostBecauseMissClick(messageReaction, user) {
    console.log('Wrong emoji');
    messageReaction.message.channel.send('<@' + user.id + '> is that a missclick? Looks like you will be a coward...');
    setNicknameTo(messageReaction.message.guild.me, 'Coward', user);
    restart(user);
}

function won(messageReaction, user) {
    console.log('Fought back');
    messageReaction.message.channel.send('<@' + user.id + '> is not a coward!');
}

function restart(user) {
    console.log('Restarting');
    startTime.delete(user);
    currentOpponent.delete(user);
}

function checkIfDbExists(guild) {
    const querySnapshot = admin.firestore().collection('guilds').doc('guild-' + guild.id).collection('subcollection').get().then(querySnapshot => {
        //table already exists
        console.log(`Found document`);
    }).catch(async documentSnapshot => {
        //create a table for this guild
        const data = {
            name: guild.name,
            id: guild.id
        };
        const res = await db.collection('guilds').doc('guild-' + guild.id).set(data);
    });
}

client.login(config.token);
