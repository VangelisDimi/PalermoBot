//Initial configuration

//Packages
const Discord = require('discord.js');//Location of discord library
const ffmpeg = require('ffmpeg');
const {prefix, token } = require('./config.json');//Location of config file with prefix and bot token
const client = new Discord.Client();
var ServerID;
var message;
var voiceChannel;
var server;
var textchannel;
var isStarted=false;//Check if the game has already started

//Files Required
const setup = require('./setup.js');
const help = require('./help.js');


client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity(`Mafia|${prefix}start|${prefix}help`);
});

client.on('message',async function(input){
	if(input.guild.available)
	{
		let message=input;
		console.log(message.content);
		//Start Cpmmand
		if(message.content === (`${prefix}start`) && isStarted===false)
		{
			let server = message.guild;
			let ServerID = client.guilds.get(message.guild.id).id;
			textchannel = message.channel;
			//Not in a server
	        if(message.channel.name == undefined)
	        {
	            message.author.send("You must be in a server to start a new game");
	            return;
			}
			voiceChannel = message.member.voiceChannel;
			//No voice channel
			if(voiceChannel === undefined)
			{
				message.channel.send("Please join a voice channel with all the players  and then start a new game");
			}
			else
			{
				//Start
				await message.channel.send("Starting a new game");
				message.channel.send("The night falls in palermo!",{ files: ["./Assets/Pictures/StartGame.png"] });
				Promise.all([ServerID,message,voiceChannel,server,client,prefix,Discord,textchannel]).then(()=>
				{
					//Uncomment if you want the bot to play music
					voiceChannel.join()/*.then(connection => {
						const dispatcher = connection.playFile('./Assets/Audio/godfather.mp3');
						dispatcher.on("end", end => {
							//voiceChannel.leave();
						});
					})*/
					.then(async ()=>{
							module.exports.info = {
								ServerID : ServerID,
								client : client,
								message : message,
								voiceChannel : voiceChannel,
								prefix : prefix,
								server : server,
								textchannel : textchannel
							};
						})
						.then(async ()=>{
							isStarted = true;
							await setup.cgsetup();
						});
				})
			}
		}
		//Help
		if(message.content === (`${prefix}help`))
		{
			help.print(message);
		}
		//Stop the Game
		if(message.content === (`${prefix}stop`))
        {
            this.textchannel.send("Ending the game");
            process.exit();
        }
	}
});

client.on('voiceStateUpdate',async (oldMember, newMember) => {
	Promise.all([voiceChannel,textchannel]).then(async ()=>
	{
		let oldUserChannel = oldMember.voiceChannel;
		let newUserChannel = newMember.voiceChannel;
		if(oldUserChannel!= undefined)
		{
			//Kicked out of game voice channel
			if(client.voiceChannel != voiceChannel && oldUserChannel!=newUserChannel && oldUserChannel!=client.voiceChannel && newMember.user===client.user)
			{
				await textchannel.send("Kicked out-Disconnecting");
				process.exit();
			}
			//Everyone has left the voice channel
			if(oldUserChannel===voiceChannel && oldUserChannel.members.size<=1)
			{
				await voiceChannel.leave();
				await textchannel.send("Everyone has left the channel-Disconnecting");
				process.exit();
			}
		}
	})
});

client.login(token);