var fs = require('fs');
var request = require('request');
const Discord = require('discord.js');
const client = new Discord.Client();
const emojiCharacters = require('./emojiCharacters');

var currencyArray = [];

var questions = [];
var questionstate = false;
var currentQuestionIndex = -1;
var currentResponseArray = [];

var remoteQuestionsURL = 'https://opentdb.com/api.php?amount=1&category=15&type=multiple';
var currentRemoteResponse = "";
var currentRemoteResponseArray = [];
var wasRemote = false;

var noms = [];
var instultes = [];

checkIfCurrencyFileExists();
getKentusFoucaultFile();
getNamesFile();

client.on('ready', () => {
    console.log("Logged in as " + client.user.username);
    client.user.setActivity('kentushelp', { type: 'PLAYING' });
});

client.on('message', async msg => {
    //Bathr commandes--------------------------
     if (msg.content.includes("kentushelp")) {
        msg.channel.send({embed: { color: 8447033,
            author: {
                name: client.username,
                icon_url: client.avatarURL
            },
            title: "Commandes",
            fields: [{
                name: "<:seb:622819275874369546> kentustalk",
                value: "bathr"
             },
             {
                name: "<:seb:622819275874369546> kentusjoin",
                value: "Rejoins la course à la bathr pour faire les commandes bathr"
             },
             {
                name: "<:seb:622819275874369546> kentusbathr",
                value: "Check le paxon"
             },
              {
                name: "<:seb:622819275874369546> kentusboard",
                value: "Leaderbathr"
             },
             {
                name: "<:seb:622819275874369546> kentusbeg",
                value: "Mendie de la bathr"
             },
             {
                name: "<:seb:622819275874369546> kentusflip <quantité>",
                value: "Flip la bathr"
             },
             {
                name: "<:seb:622819275874369546> kentusfoucault",
                value: "The game"
             }]
        }});
    }
    //Kentustalk
    if (msg.content.includes("kentustalk")) {
        var nom = noms[Math.floor(Math.random()*noms.length)];
        var insulte = instultes[Math.floor(Math.random()*instultes.length)];
        msg.channel.send(nom + " " + insulte);
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
    //Currency--------------------------
    //Join
    if (msg.content == "kentusjoin") {
        var t = true;
        for (var i of currencyArray)
            if (i.name == msg.author.username)
                t = false;
        if (t) {
            await currencyArray.push({name : msg.author.username, value: 30});
            msg.channel.send({embed: { color: 3443083,
                author: {
                    name: client.name,
                    icon_url: client.avatarURL
                },
                title: "Athlètes",
                description:  msg.author.username + " joining",
                fields: currencyArray
            }});
            fs.writeFile('currency.json', JSON.stringify(currencyArray), err => {
                if (err) throw err;
            });
        }
        else
            msg.channel.send("Déja dans la course");
    }
    //combien de bathr il reste
    if (msg.content == "kentusbathr")
        for (var i of currencyArray)
            if (i.name == msg.author.username)
                msg.channel.send("Il te reste " + i.value + " de bathr");
    //Leaderboard
    if (msg.content == "kentusboard")
        msg.channel.send({embed: { color: 9442093,
                                author: {
                                    name: client.name,
                                    icon_url: client.avatarURL
                                },
                                title: "Leaderbathr",
                                fields: currencyArray
                            }});
    //Mendier la bathr
    if (msg.content == "kentusbeg") {
     for (var i of currencyArray)
            if (i.name == msg.author.username) {
                var quantity = Math.floor(Math.random() * 40);
                i.value += quantity;
                msg.channel.send("T'as gratté un " + quantity);
                fs.writeFile('currency.json', JSON.stringify(currencyArray), err => {
                    if (err) throw err;
                });
            }
    }
    //Flip
    if (msg.content.startsWith("kentusflip")) {
        var res = msg.content.split(" ");
        if (res.length == 2) {
            res = parseInt(res[1]);
            if (Number.isInteger(res)) {
                var coin = Math.random();
                for (var i of currencyArray)
                    if (i.name == msg.author.username)
                        if (i.value < res)
                            msg.channel.send("Pas assez de bathr");
                        else
                            if (coin < 0.5) {
                                i.value -= res;
                                msg.channel.send("PERDU");
                            }
                            else {
                                 i.value += Math.floor(1.5 * res);
                                 msg.channel.send("Gagné " + Math.floor(1.5 * res) + " bathr");
                            }
                fs.writeFile('currency.json', JSON.stringify(currencyArray), err => {
                    if (err) throw err;
                });
            }
            else
                msg.channel.send("Tu fais n'imp");
        }
        else
            msg.channel.send("Tu fais n'imp");
    }
    //Kentus veut gagner des millions
    if (msg.content == "kentusfoucault") {
        var val, isRemote;
        isRemote = Math.random();
        for (var i of currencyArray)
            if (i.name == msg.author.username)
                val = i.value;
            if (!questionstate) {
                if (val > 0.5) {
                    questionstate = true;
                    request(remoteQuestionsURL, function (error, response, body) {
                        //------------------- Questions persos
                        if (isRemote < 0.5)
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
                                  author: {
                                  name: msg.author.username,
                                  icon_url: msg.author.avatarURL
                                },
                                description: "Pour " + msg.author.username,
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
                                 }],
                                 footer: {
                                  icon_url: client.user.avatarURL,
                                  text: "Question à 420 bathr"
                                }
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
                              author: {
                              name: msg.author.username,
                              icon_url: msg.author.avatarURL
                            },
                            description: "Pour " + msg.author.username,
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
                             }],
                             footer: {
                              icon_url: client.user.avatarURL,
                              text: "Question à 420 bathr"
                            }
                        }});
                        wasRemote = true;
                    }
                });
            }
            else
                msg.channel.send("T'as pas assez de bathr (<100)");
        }
        else
            msg.channel.send("Une question est en cours");
    }
    //Kentus veut gagner des millions - réponse
    if (msg.content == "A" || msg.content == "B" || msg.content == "C" || msg.content == "D") {
        if (questionstate) {
            var id;
            if (msg.content == "A") id = 0;
            if (msg.content == "B") id = 1;
            if (msg.content == "C") id = 2;
            if (msg.content == "D") id = 3;
            for (var i of currencyArray)
                if (i.name == msg.author.username) {
                    var rep;
                    if (!wasRemote) {
                        rep = questions[currentQuestionIndex].reponse;
                        if (rep == currentResponseArray[id]) {
                        i.value += 420;
                        msg.channel.send(msg.author.username + " a win le game (+420 de bathr)");
                        }
                        else {
                            i.value -= 100;
                            msg.channel.send("Je te prends ta bathr espèce d'ignare");
                        }
                    }
                    else {
                        rep = currentRemoteResponse;
                        if (rep == currentRemoteResponseArray[id]) {
                            i.value += 420;
                            msg.channel.send(msg.author.username + " a win le game (+420 de bathr)");
                        }
                        else {
                            i.value -= 100;
                            msg.channel.send("Je te prends ta bathr espèce d'ignare");
                        }
                    }
                }
        questionstate = false;
        }
    }
    if (msg.content == "kentusmagic") {
        for (var i of currencyArray)
                if (i.name == msg.author.username)
                    i.value = 500;
    }

    if (msg.content == "kentusset") {
        var interval = setInterval (function () {
        var nom = noms[Math.floor(Math.random()*noms.length)];
        var insulte = instultes[Math.floor(Math.random()*instultes.length)];
           msg.channel.send(nom + " " + insulte)
            .catch(console.error);
        }, 1 * 5000);
    }

});

function checkIfCurrencyFileExists() {
    fs.exists('currency.json', function(yes) {
        if (yes)
            fs.readFile('currency.json', function readFileCallback(err, data) {
                if (!err)
                    currencyArray = JSON.parse(data);
            });
    });
}

async function kentusInsultes() {

}

function getKentusFoucaultFile(){
    fs.exists('questions.json', function(yes) {
        if (yes)
            fs.readFile('questions.json', function readFileCallback(err, data) {
                if (!err)
                    questions = JSON.parse(data);
        });
    });
}

function getNamesFile(){
    fs.exists('insultes.json', function(yes) {
        if (yes)
            fs.readFile('insultes.json', function readFileCallback(err, data) {
                if (!err) {
                    var arr = JSON.parse(data);
                    noms = arr[0];
                    instultes = arr[1];
                }
        });
    });
}

client.login('');
