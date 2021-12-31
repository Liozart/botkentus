var fs = require('fs');
var request = require('request');
var cron = require("cron");
const Discord = require('discord.js');
const client = new Discord.Client();
const emojiCharacters = require('./emojiCharacters');
const token = require('./token');

var questions = [];
var questionstate = false;
var currentQuestionIndex = -1;
var currentResponseArray = [];
var remoteQuestionsURL = 'https://opentdb.com/api.php?amount=1&category=15&type=multiple';
var currentRemoteResponse = "";
var currentRemoteResponseArray = [];
var wasRemote = false;

var server;
var memeChannelId = 748881106694176850;
var memeChannelDebugOutputId = 893833370348429332;

var DEBUG = false;

var memeChannel, memeChannelDebugOutput;
var memeJob, cleanJob, leaderboardJob;
var sentMemesIndex = new Map();

var emojiChannel = [617457210645282818, 748902332690858096, 748881106694176850];
var allEmojis;

getKentusFoucaultFile();

client.on('ready', () => {
    client.user.setActivity('kentushelp', { type: 'PLAYING' });
	client.guilds.forEach((guild) => {
        server = guild;
        // List all channels
        guild.channels.forEach((channel) => {
			if (channel.id == memeChannelId)
				memeChannel = channel;
            if (channel.id == memeChannelDebugOutputId)
                memeChannelDebugOutput = channel;
        });
    });
    console.log(" -------------- Logged in as " + client.user.username + " in " + server + " -------------- ");

	memeJob = new cron.CronJob('00 00 8,13,20 * * *', GetMemeFromAYearAgo);
	memeJob.start();

	cleanJob = new cron.CronJob('00 00 00 * * *', CleanIndexes);
	cleanJob.start();

	leaderboardJob = new cron.CronJob('00 00 12 1 * *', DisplayEmojiLeaderBoard)
	leaderboardJob.start();
});

function CleanIndexes()
{
    sentMemesIndex = new Map();
    console.log(" - Cleaning indexes");
}

function GetMemeFromDate(msg)
{
    var i = msg.indexOf('/');
    if (i == -1)
    {
        if (!DEBUG)
        {
            memeChannel.send("Date de tes morts").then(msg.delete({ timeout: 50000 }));
        }
        else
        {
            memeChannelDebugOutput.send("Date de tes morts").then(msg.delete({ timeout: 50000 }));
        }
        return;
    }

    var date = new Date();
    var msgOffsetId = memeChannel.lastMessageID;
    var d = msg.slice(11, 13), m = msg.slice(14, 16), y = msg.slice(17, 21);
    if (isNaN(d) || isNaN(m) || isNaN(y) )
    {
        if (!DEBUG)
            memeChannel.send("Date de tes morts").then(msg.delete({ timeout: 50000 }));
        else
            memeChannelDebugOutput.send("Date de tes morts").then(msg.delete({ timeout: 50000 }));
        return;
    }

    date.setDate(d);
    date.setMonth(m - 1);
    date.setFullYear(y);

    console.log(" - Getting memes from " + date);
    memeChannel.startTyping();
    sendRandomFileFromDate(msgOffsetId, date, true);
    memeChannel.stopTyping();
}

function GetMemeFromAYearAgo()
{
    var msgOffsetId = memeChannel.lastMessageID;
    var aYearAgo = new Date();
    aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);
    console.log(" - Getting memes from " + aYearAgo);

    memeChannel.startTyping();
    sendRandomFileFromDate(msgOffsetId, aYearAgo, true);
    memeChannel.stopTyping();
}

function sendRandomFileFromDate(msgOffsetId, aDate, putInArray)
{
    var msgLimit = 100;
    var put = true;
    memeChannel.fetchMessages({limit: msgLimit, before: msgOffsetId}).then(messages => {
        messages = messages.array();
        msgOffsetId = messages[msgLimit - 1].id;
        if (messages[msgLimit - 1].createdAt.getTime() <= aDate.getTime())
        {
            memeChannel.fetchMessages({limit: msgLimit, before: msgOffsetId}).then(messagesRest => {
                messagesRest = messagesRest.array();
                var messagesOfDay = messages.filter(msg => msg.createdAt.getDate() == aDate.getDate());
                var messagesOfDayRest = messagesRest.filter(msg => msg.createdAt.getDate() == aDate.getDate());
                messagesOfDay = messagesOfDayRest.concat(messagesOfDay);
                var msgWithFiles = messagesOfDay.filter(msg => msg.attachments.size > 0);
                var msgCount = 0, cnt = 0;

                msgCount = msgWithFiles.length;
                if (msgCount > 0)
                {
                    console.log(" - " + msgCount + " messages that day.")
                    var rand = Math.floor(Math.random() * msgCount);
                    if (putInArray)
                    {
                        var dateid = aDate.getDate() + "." + aDate.getMonth() + "." + aDate.getFullYear();
                        if (sentMemesIndex.get(dateid) == undefined)
                            sentMemesIndex.set(dateid, []);
                        console.log(sentMemesIndex);
                        console.log("--------------------------------");
                        if (sentMemesIndex.get(dateid).includes(rand) && sentMemesIndex.get(dateid).length >= msgCount)
                            put = false;
                        else
                        {
                            while (sentMemesIndex.get(dateid).includes(rand) && sentMemesIndex.get(dateid).length < msgCount)
                            {
                                rand = Math.floor(Math.random() * msgCount);
                            }
                            sentMemesIndex.get(dateid).push(rand);
                            console.log(sentMemesIndex);
                        }
                    }

                    if (put)
                    {
                        msgWithFiles.forEach(msg => {
                            if (cnt == rand && msg.author != client.user)
                            {
                                console.log(" - URL : " + msg.attachments.first().url);
                                if (!DEBUG)
                                {
                                    memeChannel.send("Random maymay du " + aDate.getDate() + "/" +
                                                                           (aDate.getMonth() + 1) + "/" +
                                                                           aDate.getFullYear() + ", par " + msg.author + ":",
                                                                           {files: [msg.attachments.first().url]});
                                }
                                else
                                {
                                    memeChannelDebugOutput.send("Random maymay du " + aDate.getDate() + "/" +
                                                                           (aDate.getMonth() + 1) + "/" +
                                                                           aDate.getFullYear() + ", par " + msg.author + ":",
                                                                           {files: [msg.attachments.first().url]});
                                }

                            }
                            cnt++;
                        });
                    }
                    else
                    {
                        if (!DEBUG)
                        {
                            memeChannel.send("Pas plus de maymays postés le " + aDate.getDate() + "/" +
                                                                       (aDate.getMonth() + 1) + "/" +
                                                                       aDate.getFullYear() + ".");
                        }
                        else
                        {
                           memeChannelDebugOutput.send("Pas plus de maymays postés le " + aDate.getDate() + "/" +
                                                                       (aDate.getMonth() + 1) + "/" +
                                                                       + aDate.getFullYear() + ".");
                        }
                        memeChannel.stopTyping();
                    }
                }
                else
                {
                    console.log(" - No maymay today");
                    if (!DEBUG)
                    {
                        memeChannel.send("Pas de maymays postés le " + aDate.getDate() + "/" +
                                                                   (aDate.getMonth() + 1) + "/" +
                                                                   aDate.getFullYear() + ". TRISTESSE");
                    }
                    else
                    {
                       memeChannelDebugOutput.send("Pas de maymays postés le " + aDate.getDate() + "/" +
                                                                   (aDate.getMonth() + 1) + "/" +
                                                                   + aDate.getFullYear() + ". TRISTESSE");
                    }
                    memeChannel.stopTyping();
                }
            });
        }
        else
            sendRandomFileFromDate(msgOffsetId, aDate, putInArray);
    });
}

function DisplayEmojiLeaderBoard()
{
    allEmojis = new Map();

    var msgOffsetId = memeChannel.lastMessageID;

    var aMonthAgo = new Date();
    if (aMonthAgo.getMonth() == 0)
    {
        aMonthAgo.setMonth(11);
        aMonthAgo.setFullYear(aMonthAgo.getFullYear() - 1);
    }
    else
        aMonthAgo.setMonth(aMonthAgo.getMonth() - 5);
    console.log(" - Leaderboard " + aMonthAgo);

    memeChannel.startTyping();
    CountEmojis(msgOffsetId, aMonthAgo);
    memeChannel.stopTyping();
}

function CountEmojis(msgOffsetId, aMonthAgo)
{
    var mgsLimit = 100;

    memeChannel.fetchMessages({limit: mgsLimit, before: msgOffsetId}).then(messages => {
        messages = messages.array();
        msgOffsetId = messages[mgsLimit - 1].id;

        messages.forEach(msg => {
            if (msg.content.includes("<:"))
            {
                var rx = /<:.*:[0-9]{18}>/g;
                var rx2 = /[0-9]{18}/g;
                var em = rx.exec(msg.content);
                var emo = [];
                em.forEach(s => { emo.push(rx2.exec(s)); });
                emo.forEach(id => {
                    if (allEmojis.get(id) == undefined)
                        allEmojis.set(id, 1);
                    else
                        allEmojis.set(id, allEmojis.get(id) + 1);
                 });
            }
            msg.reactions.forEach(reac => {
                if (allEmojis.get(reac.emoji.id) == undefined)
                    allEmojis.set(reac.emoji.id, 1);
                else
                    allEmojis.set(reac.emoji.id, allEmojis.get(reac.emoji.id) + 1);
            });
        });
        if (messages[mgsLimit - 1].createdAt.getTime() > aMonthAgo.getTime())
            CountEmojis(msgOffsetId, aMonthAgo);
        else
        {
            var sorted = new Map([...allEmojis.entries()].sort((a, b) => b[1] - a[1]));
            var f = [];
            for (var [key, val] of sorted) {
                if (key != null && !isNaN(val))
                    f.push({name: "<:blobreach:" + key + ">", value:val})
            }
            if (!DEBUG)
                memeChannel.send({embed: { color: 3447003,
                    title: "Leaderboard du mois pour " + memeChannel.name,
                    fields: f
                }});
            else
                memeChannelDebugOutput.send({embed: { color: 3447003,
                    title: "Leaderboard du mois pour " + memeChannel.name,
                    fields: f
                }});
        }
    });
}

client.on('message', async msg => {
    //kentus Meme
    if (msg.content.includes("kentusmeme"))
    {
        GetMemeFromDate(msg.content);
        msg.delete({ timeout: 50000 });
    }
    //kentus emoji Leaderboard
    if (msg.content.includes("kentuslead"))
    {
        DisplayEmojiLeaderBoard();
    }
    //Kentus help
    if (msg.content.includes("kentushelp")) {
        msg.channel.send({embed: { color: 8447033,
            author: {
                name: client.username,
                icon_url: client.avatarURL
            },
            title: "Commandes",
            fields: [
             {
                name: "<:seb:622819275874369546> kentusmeme xx/xx/xxxx",
                value: "Un meme de la date demandée, par ex. 16/01/2021"
             },
             {
                name: "<:seb:622819275874369546> kentuslead",
                value: "Affiche le leaderboard des reactions du mois"
             },
             {
                name: "<:seb:622819275874369546> kentusf",
                value: "The game"
             }]
        }});
    }
    //Bathr emoji
    if (msg.content == "bathr" || msg.content.includes("apéro") || msg.content.includes("apero")) {
        try {
            await msg.react(emojiCharacters.b);
            await msg.react(emojiCharacters.a);
            await msg.react(emojiCharacters.t);
            await msg.react(emojiCharacters.h);
            await msg.react(emojiCharacters.r);
        } catch (error) {
            console.error('One of the emojis failed to react.');
        }
    }
    //Kentus veut gagner des millions
    if (msg.content == "kentusf") {
        var isRemote;
        isRemote = Math.random();
        if (!questionstate) {
            questionstate = true;
            request(remoteQuestionsURL, function (error, response, body) {
                //------------------- Questions persos
                if (isRemote < 0.2)
                {
                    currentQuestionIndex = Math.floor(Math.random()*questions.length);
                    var randarr = questions[currentQuestionIndex].propositions;
                    //Suffle array
                    var currentIndex = randarr.length, temporaryValue, randomIndex;
                    while (0 !== currentIndex) {
                        randomIndex = Math.floor(Math.random() * currentIndex);
                        currentIndex -= 1;
                        temporaryValue = randarr[currentIndex];
                        randarr[currentIndex] = randarr[randomIndex];
                        randarr[randomIndex] = temporaryValue;
                    }
                    msg.channel.send({embed: { color: 3447003,
                        title: "Question : " + questions[currentQuestionIndex].question,
                        fields: [{
                            name: "A - " + randarr[0],
                            value: " --- "
                         },
                         {
                            name: "B - " + randarr[1],
                            value: " --- "
                         },
                         {
                            name: "C - " + randarr[2],
                            value: " --- "
                         },
                          {
                            name: "D - " + randarr[3],
                            value: " --- "
                         }]
                    }});
                currentResponseArray = randarr;
                wasRemote = false;
            }
            //-------------------Remote questions
            else
            {
                var remotequest = JSON.parse(body);
                console.log(remotequest);
                currentRemoteResponse = remotequest.results[0].correct_answer;
                currentRemoteResponseArray = remotequest.results[0].incorrect_answers;
                currentRemoteResponseArray.push(currentRemoteResponse);

                remotequest.results[0].question = remotequest.results[0].question.replace(/&quot;/g, '"');
                remotequest.results[0].question = remotequest.results[0].question.replace(/&amp;/g, '&');
                remotequest.results[0].question = remotequest.results[0].question.replace(/&#039;/g, "'");
                currentRemoteResponse = currentRemoteResponse.replace(/&quot;/g, '"');
                currentRemoteResponseArray.forEach(s => { s = s.replace(/&quot;/g, '"'); });

                //Suffle array
                var currentIndex = currentRemoteResponseArray.length, temporaryValue, randomIndex;
                while (0 !== currentIndex) {
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;
                    temporaryValue = currentRemoteResponseArray[currentIndex];
                    currentRemoteResponseArray[currentIndex] = currentRemoteResponseArray[randomIndex];
                    currentRemoteResponseArray[randomIndex] = temporaryValue;
                }
                msg.channel.send({embed: { color: 3447003,
                    title: "Question : " + remotequest.results[0].question,
                    fields: [{
                        name: "A - " + currentRemoteResponseArray[0],
                        value: " --- "
                     },
                     {
                        name: "B - " + currentRemoteResponseArray[1],
                        value: " --- "
                     },
                     {
                        name: "C - " + currentRemoteResponseArray[2],
                        value: " --- "
                     },
                      {
                        name: "D - " + currentRemoteResponseArray[3],
                        value: " --- "
                     }]
                }});
                wasRemote = true;
            }});
        }
        else
            msg.channel.send("Une question est en cours");
    }
    //Kentus veut gagner des millions - réponse
    if (msg.content.toUpperCase()  == "A" || msg.content.toUpperCase()  == "B" || msg.content.toUpperCase()  == "C" || msg.content.toUpperCase()  == "D") {
        if (questionstate) {
            var id;
            if (msg.content.toUpperCase() == "A") id = 0;
            if (msg.content.toUpperCase() == "B") id = 1;
            if (msg.content.toUpperCase() == "C") id = 2;
            if (msg.content.toUpperCase() == "D") id = 3;
            var rep;
            if (!wasRemote) {
                rep = questions[currentQuestionIndex].reponse;
                if (rep == currentResponseArray[id]) {
                msg.channel.send(msg.author.username + " a win le game (+420 de bathr)");
                }
                else {
                    msg.channel.send("Je te prends ta bathr espèce d'ignare");
                }
            }
            else {
                rep = currentRemoteResponse;
                if (rep == currentRemoteResponseArray[id]) {
                    msg.channel.send(msg.author.username + " a win le game (+420 de bathr)");
                }
                else {
                    msg.channel.send("Je te prends ta bathr espèce d'ignare");
                }
            }
        }
    questionstate = false;
    }
});

function getKentusFoucaultFile(){
    fs.exists('questions.json', function(yes) {
        if (yes)
            fs.readFile('questions.json', function readFileCallback(err, data) {
                if (!err)
                    questions = JSON.parse(data);
        });
    });
}

client.login(token.token);