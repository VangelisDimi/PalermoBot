const Discord = require('discord.js');
const game = require('./Game.js');
const Bot = require('./index.js');
const playerclass = require('./Player.js');
const roles = require('./roleenum.js');

//Setup for game only with basic roles
async function classicgamesetup()
{
    const gamename ='palermo-nights-game', assasinname='assasin-channel-palermo-nights';
    var tchannel=false;
    var bottchannel,assasinchannel;
    var pcount=0;
    
    //Create game text channels
    Bot.info.server.channels.forEach(channel => 
    {
    	if(channel.name === gamename)//Game text channel already exists
    	{
    		tchannel=true;//Create a variable for the text channel
            bottchannel=channel;
    	}
        if(channel.name === assasinname)//Delete previous assasin channel
        {
            channel.delete();
        }
    });

    //Create a new game text channel if it doesn't already exist
    if(Boolean(tchannel)===false)
    {
    	Bot.info.server.createChannel(gamename,"text");
    }

    //Set the game text channel
    bottchannel=Bot.info.server.channels.find("name",gamename);

    /*Find all the players in the voice channel
    excluding bots and get their count*/
    Bot.info.voiceChannel.members.forEach(member =>
    {
        if(member.user.bot===true) return;
        console.log(member.user.tag);
        pcount++;
    });

    //Create an array with all the players
    var c=0,players=new Array(pcount),rolecount=new Array(4);

    if(pcount<3) {
        bottchannel.send("There aren't enough players to start the game");
        return;
    }
    //Fill the array with players and create their roles
    else{
        botvchannel.members.forEach(member =>
        {
            players[c]=new player(member);
            c++;
        });

        rolecount[roles.hidden]=Math.floor(pcount/6);//Hidden Assasins
        rolecount[roles.visible]=(Math.floor(pcount/6))+1;//Visible Assasins
        rolecount[roles.spy]=1;//Spy
        rolecount[roles.civilian]=pcount-(rolecount[0]+rolecount[1]+rolecount[2]);//Civilians

        //Temporary
        console.log(rolecount[roles.hidden]);
		console.log(rolecount[roles.visible]);
		console.log(rolecount[roles.spy]);
		console.log(rolecount[roles.civilian]);
    }
    for(var i = 0,rolegiven = false; i < players.length ; i++,rolegiven = false)
    {
        while(Boolean(rolegiven)===false)
        {
            var role=Math.floor(Math.random() * 4);
            if(rolecount[role]>0)
            {
                players[i].setRole(role);
                rolecount[role]--;
                rolegiven=true;
                if(role===roles.hidden) players[i].Member.send("You are a hidden assasin");
                else if(role===roles.visible) players[i].Member.send("You are a visible assasin");
                else if(role===roles.spy) players[i].Member.send("You are a spy");
                else if(role===roles.civilian) players[i].Member.send("You are a civilian");
            }
        }
    }
    //Create the assasin text channel that only assasins can see (used for voting in the night)
    const everyoneRole = Bot.info.client.guilds.get(Bot.info.message.guild.id).roles.find('name', '@everyone');
    Bot.info.server.createChannel(assasinname, 'text')
    .then(async(r) => {
        //Overwrite permissions for each individual
        r.overwritePermissions(Bot.info.message.author.id, { VIEW_CHANNEL: true });
        r.overwritePermissions(everyoneRole, { VIEW_CHANNEL: false });
        assasinchannel=r;
        //Create a new game with all the info
        let cgame = new game.Game(players,bottchannel,assasinchannel,Bot.info.message.member.user,Bot.info.voiceChannel);
        //Start the game
        Promise.all([cgame]).then(async()=>
		{await cgame.gameplay();})
    })
}

module.exports.cgsetup = classicgamesetup;