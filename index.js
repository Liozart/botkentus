/* REQUIRES */
var fs = require('fs');
var request = require('request');
var cron = require("cron");
const Discord = require('discord.js');
const client = new Discord.Client();
const emojiCharacters = require('./emojiCharacters');
const token = require('./token');
const ytdl = require('ytdl-core');
const yts = require('youtube-search-without-api-key');

// ----- DEBUG --------
//---------------------
var DEBUG = false; //--
//---------------------

var server;
var memeChannelId = 748881106694176850;
var memeChannelDebugOutputId = 893833370348429332;
var botMusicChannelId = 735787218127421550;
var commielandChannelId = 819571978271981578;

var memeChannel, memeChannelDebugOutput, botMusicChannel, commielandChannel;

var memeJob, cleanJob, leaderboardJob,optimizeJob;

var commandsArray = [
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
    },
    {
        name: "<:seb:622819275874369546> kentusb",
        value: "Affiche le leaderboard de bathr"
    },
    {
        name: "<:seb:622819275874369546> kblini [Lien youtube/mots clés], knext, kstop",
        value: "La musique du tiesk"
    }
];

var questions = [];
var questionstate = false;
var currentQuestionIndex = -1;
var currentResponseArray = [];
var remoteQuestionsURL = 'https://opentdb.com/api.php?amount=1&category=15&type=multiple';
var currentRemoteResponse = "";
var currentRemoteResponseArray = [];
var wasRemote = false;
var respChars = ["A", "B", "C", "D"];

var musicQueue = [];
var musicQueueNames = [];
var dispatcher;
var isPlayingMusic = false;
var refreshMemeOptimization = false;
var currentMusicChannel;

var bathrArray = [];
var optimizeIndexes = [];
var sentMemesIndex = new Map();
var moreMemeToday = true;

var allEmojis;


/* ----------------- ON READY EVENT ----------------- */

client.on('ready', () => {

    getKentusFoucaultFile();
    checkIfCurrencyFileExists();
    if(!refreshMemeOptimization)
        checkIfOptimizeIndexesExists();
	
    client.user.setActivity('kentushelp', { type: 'PLAYING' });
	client.guilds.forEach((guild) => {
        server = guild;
        //Get handpicked channels
        guild.channels.forEach((channel) => {
			if (channel.id == memeChannelId)
				memeChannel = channel;
            if (channel.id == memeChannelDebugOutputId)
                memeChannelDebugOutput = channel;
            if (channel.id == botMusicChannelId)
                botMusicChannel = channel;
            if (channel.id == commielandChannelId)
                commielandChannel = channel;
            
            
        });
    });
    console.log(" -------------- Logged in as " + client.user.username + " in " + server + " -------------- ");
	
	
	/* call OptimizeMemes sunday once a week at 15h */
	optimizeJob = new cron.CronJob('00 15 * * 0', OptimizeMemes);
	optimizeJob.start();
	
    /* Call GetMemeFromAYearAgo everyday at 09:00, 13:00 and 21:00 */
	memeJob = new cron.CronJob('00 00 8,13,20 * * *', GetMemeFromAYearAgo);
	memeJob.start();

    /* Clean indexes at midnight */
	cleanJob = new cron.CronJob('00 00 00 * * *', CleanIndexes);
	cleanJob.start();

    /* Call leaderboard the 1 of every month */
	leaderboardJob = new cron.CronJob('00 00 12 1 * *', DisplayEmojiLeaderBoard)
	leaderboardJob.start();
	
	
});

/* ----------------- ON MESSAGE EVENT ----------------- */

client.on('message', async msg => {
    //kentus Music
    if (msg.content.includes("kblini")) {
        AddMusicToQueue(msg);
    }
    //Music next
    if (msg.content == "knext") {
        NextMusic();
    }
    //Music stop
    if (msg.content == "kstop") {
        StopMusic();
    }
    //kentus Meme
    if (msg.content.includes("kentusmeme"))
    {
        GetMemeFromDate(msg);
    }
    //kentus emoji Leaderboard
    if (msg.content == "kentuslead")
    {
        DisplayEmojiLeaderBoard();
    }
    //kentus bathr Leaderboard
    if (msg.content == "kentusb")
    {
        DisplayBathr(msg.channel);
    }
    //Kentus help
    if (msg.content == "kentushelp") {
        msg.channel.send({embed: { color: 8447033,
            author: {
                name: client.username,
                icon_url: client.avatarURL
            },
            title: "Commandes",
            fields: commandsArray
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

                    var f = [];
                    for (var i = 0; i < 4; i++)
                        f.push({name: respChars[i] + " - " + randarr[i], value: " --- "});

                    msg.channel.send({embed: { color: 3447003,
                        title: "Question : " + questions[currentQuestionIndex].question,
                        fields: f
                    }});
                currentResponseArray = randarr;
                wasRemote = false;
            }
            //-------------------Remote questions
            else
            {
                var remotequest = JSON.parse(body);
                currentRemoteResponse = remotequest.results[0].correct_answer;
                currentRemoteResponseArray = remotequest.results[0].incorrect_answers;
                currentRemoteResponseArray.push(currentRemoteResponse);

                remotequest.results[0].question = ReplaceHTMLChars(remotequest.results[0].question);
                currentRemoteResponse = ReplaceHTMLChars(currentRemoteResponse);
                currentRemoteResponseArray.forEach(s => { s = ReplaceHTMLChars(s); });

                //Suffle array
                var currentIndex = currentRemoteResponseArray.length, temporaryValue, randomIndex;
                while (0 !== currentIndex) {
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;
                    temporaryValue = currentRemoteResponseArray[currentIndex];
                    currentRemoteResponseArray[currentIndex] = currentRemoteResponseArray[randomIndex];
                    currentRemoteResponseArray[randomIndex] = temporaryValue;
                }

                var f = [];
                for (var i = 0; i < 4; i++)
                    f.push({name: respChars[i] + " - " + currentRemoteResponseArray[i], value: " --- "});

                msg.channel.send({embed: { color: 3447003,
                    title: "Question : " + remotequest.results[0].question,
                    fields: f
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

            var rep, win = true;
            if (!wasRemote) {
                rep = questions[currentQuestionIndex].reponse;
                if (rep == currentResponseArray[id]) {
                    msg.channel.send(msg.author.username + " a win le game (+420 de bathr)");
                }
                else {
                    win = false;
                    msg.channel.send("No bathr 4 u");
                }
            }
            else {
                rep = currentRemoteResponse;
                if (rep == currentRemoteResponseArray[id]) {
                    msg.channel.send(msg.author.username + " a win le game (+420 de bathr)");
                }
                else {
                    win = false;
                    msg.channel.send("No bathr 4 u");
                }
            }
            if (win)
                WriteBathrChanges(msg.author.username, 420);
            else
                WriteBathrChanges(msg.author.username, 0);
        }
    questionstate = false;
    }
});

/* ----------------- MEME FUNCTIONS ----------------- */

/* add the last message id from memechannel to the optimization file */
function OptimizeMemes(){
	//console.log(optimizeIndexes);
	optimizeIndexes.unshift({snowflake : memeChannel.lastMessageID , date : Discord.SnowflakeUtil.deconstruct(memeChannel.lastMessageID).date});
	writeOptimizationFile();
}

/* Reset indexes used with jobs */
function CleanIndexes()
{
    sentMemesIndex = new Map();
    moreMemeToday = true;
    console.log(" - Cleaning indexes");
}

/* Check date format and call GetMeme with the date*/
function GetMemeFromDate(msg)
{
    var i = msg.content.indexOf('/');
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
    var d = msg.content.slice(11, 13), m = msg.content.slice(14, 16), y = msg.content.slice(17, 21);
    if (isNaN(d) || isNaN(m) || isNaN(y) )
    {
        if (!DEBUG)
            memeChannel.send("Date de tes morts").then(msg.delete({ timeout: 50000 }));
        else
            memeChannelDebugOutput.send("Date de tes morts").then(msg.delete({ timeout: 50000 }));
        return;
    }

    date.setDate(d);
    date.setMonth(m-1);
    date.setFullYear(y);

    console.log(" - Getting memes from " + date);

    msg.delete({ timeout: 50000 });
    memeChannel.startTyping();
    sendRandomFileFromDateHandler(msgOffsetId, date, true, false);
    memeChannel.stopTyping();
}

/* Job function, call GetMeme for today - 1 year */
function GetMemeFromAYearAgo()
{
    var msgOffsetId = memeChannel.lastMessageID;
    var aYearAgo = new Date();
    aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);

    console.log(" - Getting memes from " + aYearAgo);

    memeChannel.startTyping();
    sendRandomFileFromDateHandler(msgOffsetId, aYearAgo, true, true);
    memeChannel.stopTyping();
    
}
/* handler to optimize dem memes */
function sendRandomFileFromDateHandler(msgOffsetId, aDate, putInArray, isAutoJob){
    var tmpmsgid = msgOffsetId;
    optimizeIndexes.forEach(tmp => {
        var tmpDate = new Date(tmp.date);
        if(tmpDate < aDate)
        {
            tmpmsgid = tmp.snowflake;
        }
    });
    sendRandomFileFromDate(tmpmsgid, aDate, putInArray, isAutoJob);
}
/* Send a random file from a specified day (recursive) */
function sendRandomFileFromDate(msgOffsetId, aDate, putInArray, isAutoJob)
{
    var msgLimit = 100;
    var put = true;
    var displayDate = aDate.getDate() + "/" + (parseInt(aDate.getMonth()) + 1) + "/" + aDate.getFullYear();

    memeChannel.fetchMessages({limit: msgLimit, before: msgOffsetId}).then(messages => {
        messages = messages.array();
        msgOffsetId = messages[msgLimit - 1].id;
        if (refreshMemeOptimization)
            optimizeIndexes.push({snowflake : messages[msgLimit - 1].id, date : messages[msgLimit - 1].createdAt });
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
                    console.log(" - " + msgCount + " messages that day.");
                    var rand = Math.floor(Math.random() * msgCount);

                    if (putInArray)
                    {
                        var dateid = aDate.getDate() + "." + aDate.getMonth() + "." + aDate.getFullYear();
                        if (!sentMemesIndex.has(dateid))
                            sentMemesIndex.set(dateid, []);
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
                        }
                    }
                    if (put)
                    {
                        msgWithFiles.forEach(msg => {
                            if (cnt == rand && msg.author != client.user)
                            {
                                if (refreshMemeOptimization)
                                    writeOptimizationFile();
                                console.log(" - URL : " + msg.attachments.first().url);
                                if (!DEBUG)
                                {
									memeChannel.send("Random maymay du " + displayDate + ", par " + msg.author + ":",
                                                                           {files: [msg.attachments.first().url]});								   
                                }
                                else
                                {
                                    memeChannelDebugOutput.send("Random maymay du " + displayDate + ", par " + msg.author + ":",
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
                            if (isAutoJob)
                            {
                                if (moreMemeToday)
                                {
                                    moreMemeToday = false;
                                    memeChannel.send("Pas plus de maymays postés le " + displayDate + ".");
                                }
                            }
                            else
                                memeChannel.send("Pas plus de maymays postés le " + displayDate + ".");
                        }
                        else
                        {
                           memeChannelDebugOutput.send("Pas plus de maymays postés le " + displayDate + ".");
                        }
                        memeChannel.stopTyping();
                    }
                }
                else
                {
                    console.log(" - No maymay today");
                    if (!DEBUG)
                    {
                        memeChannel.send("Pas de maymays postés le " + displayDate + ". TRISTESSE");
                    }
                    else
                    {
                       memeChannelDebugOutput.send("Pas de maymays postés le " + displayDate + ". TRISTESSE");
                    }
                    memeChannel.stopTyping();
                }
            });
        }
        else
            sendRandomFileFromDate(msgOffsetId, aDate, putInArray, isAutoJob);
    });
}

/* ----------------- LEADERBOARD FUNCTIONS ----------------- */

/* Format date and call CountEmojis */
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

/* Count every server emoji in msg or reactions for the period and send board */
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
                    if (!allEmojis.has(id))
                        allEmojis.set(id, 1);
                    else
                        allEmojis.set(id, allEmojis.get(id) + 1);
                 });
            }
            msg.reactions.forEach(reac => {
                if (!allEmojis.has(reac.emoji.id))
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

/* ----------------- BATHR FUNCTIONS ----------------- */

/* Display bathr of users */
function DisplayBathr(channel)
{
    var f = [];
    bathrArray.forEach(e => {
        f.push({name: e.name, value: e.bathr});
    });
    console.log(" - Bathr Board");
    channel.send({embed: { color: 2544665,
        title: "Bathr",
        fields: f
    }});
}

/* ----------------- MUSIC FUNCTIONS ----------------- */

/* Get youtube video in message and add it to the playlist */
async function AddMusicToQueue(msg)
{
    if (msg.member.voiceChannelID == undefined)
        return;

    var ind = msg.content.indexOf("http");
    var link, name, tb;
    if (ind != -1)
    {
        link = msg.content.substr(msg.content.indexOf(" ") + 1);
        name = msg.content.substr(7);
    }
    else
    {
        link = msg.content.substr(7);
        const videos = await yts.search(link);
        link = videos[0].url;
        name = videos[0].title;
    }
    musicQueue.push(link);
    musicQueueNames.push(name);

    if (!isPlayingMusic)
       StartPlayingMusic(msg.member.voiceChannel)

    var f = [];
    for (var i = 1; i < musicQueue.length; i++)
        f.push({name: i, value: musicQueueNames[i]});

    if (musicQueueNames[0].includes("http"))
        musicQueueNames[0] = musicQueueNames[0].substr(24);

    if (f.length > 0)
    {
        botMusicChannel.send({embed: { color: 9707214,
            title: "Playing : " + musicQueueNames[0],
            url: musicQueue[0],
            description: "Queue : ",
            fields: f
        }});
    }
    else
    {
        botMusicChannel.send({embed: { color: 9707214,
            title: "Playing : " + musicQueueNames[0],
            url: musicQueue[0]
        }});
    }
}

/* Join the user channel and start playing the playlist */
async function StartPlayingMusic(channel)
{
    channel.join().then(
        connection => {
            dispatcher = connection.playStream(ytdl(musicQueue[0], { filter: 'audioonly' }));
            isPlayingMusic = true;
            currentMusicChannel = channel;

            dispatcher.on("end", function() {
                musicQueue.shift();
                musicQueueNames.shift();
                if (musicQueue.length == 0)
                {
                    channel.leave();
                    isPlayingMusic = false;
                }
                else
                    StartPlayingMusic(channel);
            });
    });
}

/* Play the next music in playlist */
function NextMusic()
{
    dispatcher.end();

    var f = [];
    for (var i = 1; i < musicQueue.length; i++)
        f.push({name: i, value: musicQueueNames[i]});

    if (musicQueue.length > 0)
        botMusicChannel.send({embed: { color: 9707214,
            title: "Playing : " + musicQueueNames[0],
            url: musicQueue[0],
            description: "Queue : ",
            fields: f
        }});
}

/* Stop all music and reset queue */
function StopMusic()
{
    currentMusicChannel.leave();
    sPlayingMusic = false;
    musicQueue = [];
    musicQueueNames = [];
    dispatcher = null;
}

/* ----------------- UTILITY FUNCTIONS ----------------- */

/* Replace HTML chars from requested questions */
function ReplaceHTMLChars(s)
{
    s = s.replace(/&quot;/g, '"');
    s = s.replace(/&amp;/g, '&');
    s = s.replace(/&#039;/g, "'");
    s = s.replace(/&eacute;/g, "é");
    s = s.replace(/&reg;/g, "®");
    s = s.replace(/&trade;/g, "™");
    return s;
}

/* Write bathr in file */
function WriteBathrChanges(name, bathr)
{
    var inArr = false;
    bathrArray.forEach(e => {
        if (e.name == name)
        {
            inArr = true;
            e.bathr = e.bathr + bathr;
        }
    });
    if (!inArr)
        bathrArray.push({name : name, bathr : bathr});
    fs.writeFile('currency.json', JSON.stringify(bathrArray), err => {
        if (err) throw err;
    });
}

/* Get personals questions from file */
function getKentusFoucaultFile(){
    fs.exists('questions.json', function(yes) {
        if (yes)
            fs.readFile('questions.json', function readFileCallback(err, data) {
                if (!err)
                    questions = JSON.parse(data);
        });
    });
}

/* Get bathr from file */
function checkIfCurrencyFileExists() {
    fs.exists('currency.json', function(yes) {
        if (yes)
            fs.readFile('currency.json', function readFileCallback(err, data) {
                if (!err)
                    bathrArray = JSON.parse(data);
            });
    });
}

/* Get bathr from file */
function checkIfOptimizeIndexesExists() {
    fs.exists('optimizeIndexes.json', function(yes) {
        if (yes)
            fs.readFile('optimizeIndexes.json', function readFileCallback(err, data) {
                if (!err)
                    optimizeIndexes = JSON.parse(data);
            });
    });
}

function writeOptimizationFile(){
    fs.writeFile('optimizeIndexes.json', JSON.stringify(optimizeIndexes),(err) => {
        if (err)
          console.log(err);
      });
}

/* ---------------------------- DISCORD BOT LAUNCH ----------------------------  */
client.login(token.token);