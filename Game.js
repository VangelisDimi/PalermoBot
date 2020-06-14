const Discord = require('discord.js');
const Bot = require('./index.js');
const playerclass = require('./Player.js');
const {prefix} = require('./config.json');
const roles = require('./roleenum.js');


class Game
{
    constructor(players,bottchannel,assasinchannel,admin,botvchannel)
    {
        this.players=players;
        this.textchannel=bottchannel;
        this.canVote=true;
        this.assasinchannel=assasinchannel;
        this.Admin=admin;
        this.voicechannel=botvchannel;
        this.assasincount=0;
        this.restcount=0;
        this.dead = [];
        this.isTied = false;
    }

    async gameplay()
    {
        const filter = m => {
            return m.content === (`${prefix}begin`) && m.member.user.tag === this.Admin.tag
        };
        var command;
        await printplayers(players,bottchannel);
        this.textchannel.send(`@${this.Admin.tag}`);
        this.textchannel.send("Use the command ;;kick.number to kick a player out of the game before starting");
        this.textchannel.send("Use the command ;;begin to finalise");
        this.textchannel.send("Use the command ;;stop to end the game");

        Bot.info.client.on('message',async (input)=>{
            //Kick player
            if(input.content.startsWith(`${prefix}kick.`) && input.member.user.tag===this.Admin.tag)
            {
                await kickplayer(input.content);
                printplayers();
            }
        });


        this.textchannel.awaitMessages(filter, { maxMatches: 1})
        .then(async ()=>{
            if(this.players.length<5)
            {
                this.textchannel.send("Not enough players to start the game");
                process.exit();
            }
        })
        .then(async ()=>{
            await this.findcounts();
            await this.textchannel.send("Begining the game");
            await this.textchannel.send("The night falls in palermo");
            await this.textchannel.send("Use the command ;;startvoting when you are ready to vote");
            this.assasinchannel.send("This is the assasin text channel\nPlease use this channel only for voting at night.");
            var pcount=this.assasincount+this.restcount,startvote=0;

            for (let player of this.players) {
                player.RevealRoles(this.players);
            }

            Bot.info.client.on('message',async (input)=>{
                //Start Voting Player Vote
                if(input.content === (`${prefix}startvoting`))
                {
                    if(this.startvotingcommand(input.member))
                    {
                        startvote++;
                        this.textchannel.send(`Starting voting (${startvote}/${pcount})`);
                        if(startvote===pcount)
                        { 	
                            await this.votingday()
                        }
                    }
                    else
                        bottchannel.send("You have already sent that command");
                }
            });
        });
    }

    async startvotingcommand(user)
    {
        for(var i = 0; i < this.players.length ; i++)
        {
            if(user===this.players[i].Member && this.players[i].canVote===true)
            {
                this.players[i].canVote=false;
                return true;
            }
        }
        return false;
    }

    async endcondition()
    {
        //Check if the game is over
        if(this.assasincount === this.restcount)
        {
            return Promise.all([
            everyoneRole = Bot.info.client.guilds.get(Bot.info.message.guild.id).roles.find('name', '@everyone'),
            this.assasinchannel.overwritePermissions(everyoneRole, { VIEW_CHANNEL: true }),
            this.textchannel.send("Assasins Won"),
            await this.endprintplayers()
            ]).then(()=>{
                return true;
            })
        }
        else if(this.assasincount<=0)
        {
            return Promise.all([
            everyoneRole = Bot.info.client.guilds.get(Bot.info.message.guild.id).roles.find('name', '@everyone'),
            this.assasinchannel.overwritePermissions(everyoneRole, { VIEW_CHANNEL: true }),
            this.textchannel.send("Civilians Won"),
            await this.endprintplayers()
            ]).then(()=>{
                return true;
            })
        }
        else
            return false;
    }

    async endprintplayers()
    {
        this.textchannel.send("Players:");
		for(var i=0;i<this.players.length;i++)
		{
			if(this.players[i].isDead===false)
                this.textchannel.send(`**${i+1}.${this.players[i].Member.user.tag}** [${this.players[i].RoleString()}]`);
			else
			{
                //Role is revealed-Dead on day
				if(this.players[i].DeadDay===true)
                    this.textchannel.send(`~~**${i+1}.${this.players[i].Member.user.tag}**~~ [${this.players[i].RoleString()}]`);
                //Role is hidden-Dead on night
				else
                    this.textchannel.send(`~~**${i+1}.${this.players[i].Member.user.tag}**~~ [${this.players[i].RoleString()}]`);
			}
		}
    }
    
    async printplayers()
	{
		this.textchannel.send("Players:");
		for(var i=0;i<this.players.length;i++)
		{
			if(this.players[i].isDead===false)
                this.textchannel.send(`**${i+1}.${this.players[i].Member.user.tag}**`);
			else
			{
                //Role is revealed-Dead on day
				if(this.players[i].DeadDay===true)
                    this.textchannel.send(`~~**${i+1}.${this.players[i].Member.user.tag}**~~ [${this.players[i].RoleString()}]`);
                //Role is hidden-Dead on night
				else
                    this.textchannel.send(`~~**${i+1}.${this.players[i].Member.user.tag}**~~`);
			}
		}
	}
	async kickplayer(message)
	{
		var thenum = message.replace( /^\D+/g, '');
		thenum--;
		let useri=this.players[thenum].Member;
		useri.setMute(true);
		this.players.splice(thenum,1);
	}
	async findcounts()
	{
		for(var i=0;i<this.players.length;i++)
		{
            if(this.players[i].isAssasin)
            {
                this.assasinchannel.overwritePermissions(this.players[i].id, { VIEW_CHANNEL: true });
                this.assasincount++;
            }
			else
                this.restcount++;
		}
		console.log("Assasins:" + this.assasincount);
		console.log("Rest:" + this.restcount);
    }
    
    //Voting
    async votingday()
    {
        await this.endprintplayers();

        
        var voters=[],x;
        this.textchannel.send("Voting Starts");
        this.textchannel.send("Use the command ;;vote.number to chose a player to kick out");
        await this.printplayers();

        let c=0;
        for(var i=0;i<this.players.length;i++)
        {
            if(this.players[i].isDead===false)
            {
                voters[c]=i;
                c++;
            }
        }

        let turn=1;
        await this.vote(voters);
        await console.log("Done!");
        return;
    }

    async nightvoters()
    {
        var nvoters = [];
        var c=0;
        //Finds Alive Assasins
        for(var i=0;i<this.players.length;i++)
        {
            if(this.players[i].isAssasin)
            {
                nvoters[c]=i;
                c++;
            }
        }
        return nvoters;
    }

    async votingnight(voters)
    {
        Promise.all(voters).then(async()=>
		{
            await this.cleanvotes("night");
            var i=0;
            let turn=voters[i];
            console.log(voters);
            console.log(voters.length);
            await this.printplayers();
            this.assasinchannel.send(`@${this.players[turn].Member.user.tag} it's your turn to vote`);
            Bot.info.client.on('message',async (input)=>{
                if(input.content.startsWith(`${prefix}vote.`) && input.member.user.tag===this.players[turn].Member.user.tag && i<voters.length)
                {
                    let thenum = input.content.replace( /^\D+/g, '');
                    await thenum--;
                    if(thenum+1<this.players.length && this.players[thenum].isDead===false && this.players[thenum].isAssasin===false && this.players[thenum].Member.user.tag != input.member.user.tag)
                    {
                        this.players[thenum].votes++;
                        this.assasinchannel.send(`You voted for ${this.players[thenum].Member.user.tag}`);
                        await i++;
                        this.assasinchannel.send(`Voted (${i}/${voters.length})`);
                        if(i>=voters.length)
                        { 
                            //Find Dead then
                            //Tie?
                            if(await this.finddead("night")===false)
                                await this.votingnight(voters);
                            else
                            {
                                await this.cleanvotes();
                                if(await this.endcondition())
                                    process.exit();
                                return Promise.all([
                                    await this.votingday()
                                ]).then(()=>{
                                    return;
                                })
                            }
                        }
                        let turn=voters[i];
                        await this.assasinchannel.send(`@${this.players[turn].Member.user.tag} it's your turn to vote`);
                    }
                    //Voted dead or voted self
                    else
                    {
                        await this.assasinchannel.send("You can't vote this player!\n Vote again!");
                    }
                }
            });
        });
    }

    vote(voters)
    {
        //Day Votings
        var i=0;
        let turn=voters[i];
        console.log(voters.length);
        this.textchannel.send(`@${this.players[turn].Member.user.tag} it's your turn to vote`);
        Bot.info.client.on('message',async (input)=>{
            if(input.content.startsWith(`${prefix}vote.`) && input.member.user.tag===this.players[turn].Member.user.tag && i<voters.length)
            {
                let thenum = input.content.replace( /^\D+/g, '');
                await thenum--;
                if(thenum+1<this.players.length && this.players[thenum].isDead===false && this.players[thenum].Member.user.tag != input.member.user.tag)
                {
                    this.players[thenum].votes++;
                    this.textchannel.send(`You voted for ${this.players[thenum].Member.user.tag}`);
                    await i++;
                    this.textchannel.send(`Voted (${i}/${voters.length})`);
                    if(i>=voters.length)
                    { 
                        //Find Dead then
                        //Tie?
                        if(await this.finddead("day")===false)
                        {
                            await this.tievoting(await this.tievoters(voters));
                        }
                        else
                        {
                            if(await this.endcondition())
                                process.exit();
                            await this.cleanvotes()
                            .then(async ()=>{
                                await this.votingnight(await this.nightvoters());
                            });
                        }
                        return;
                    }
                    let turn=voters[i];
                    await this.textchannel.send(`@${this.players[turn].Member.user.tag} it's your turn to vote`);
                }
                //Voted dead or voted self
                else
                {
                    await this.textchannel.send("You can't vote this player!\n Vote again!");
                }
            }
        });
    } 

    async tievoters(voters)
    {
        var tievoters = voters;
        //Removes top voted players from the voters array
        for(var i=0;i<this.dead.length;i++)
            tievoters.splice(this.dead[i],1);
        return tievoters;
    }

    async tievoting(voters)
    {
        Promise.all(voters).then(async()=>
		{
        //Using the voters array for any possible second ties
        await this.cleanvotes("tie");
        //Vote only dead players
        var i=0;
        let turn=voters[i];
        console.log(voters);
        console.log(voters.length);
        await this.printtieplayers();
        this.textchannel.send(`@${this.players[turn].Member.user.tag} it's your turn to vote`);
        Bot.info.client.on('message',async (input)=>{
            if(input.content.startsWith(`${prefix}vote.`) && input.member.user.tag===this.players[turn].Member.user.tag && i<voters.length)
            {
                let thenum = input.content.replace( /^\D+/g, '');
                await thenum--;
                if(thenum+1<this.players.length && this.players[thenum].isDead===false && this.players[thenum].isTied && this.players[thenum].Member.user.tag != input.member.user.tag)
                {
                    this.players[thenum].votes++;
                    this.textchannel.send(`You voted for ${this.players[thenum].Member.user.tag}`);
                    await i++;
                    this.textchannel.send(`Voted (${i}/${voters.length})`);
                    if(i>=voters.length)
                    { 
                        //Find Dead then
                        //Tie?
                        if(await this.finddead("day") === false)
                            await this.tievoting(voters);
                        else
                        {
                            await this.cleanvotes("day");
                            if(await this.endcondition())
                                process.exit();
                            await this.votingnight(await this.nightvoters());
                            return;
                        }
                    }
                    let turn=voters[i];
                    await this.textchannel.send(`@${this.players[turn].Member.user.tag} it's your turn to vote`);
                }
                //Voted dead or voted self
                else
                {
                    await this.textchannel.send("You can't vote this player!\n Vote again!");
                }
            }
        });
        });
    }

    async printtieplayers()
    {
        //Print players that are tied in votes
        this.textchannel.send("Players:");
		for(var i=0;i<this.dead.length;i++)
		{
            this.textchannel.send(`**${i+1}.${this.players[this.dead[i]].Member.user.tag}**`);
		}
    }

    async finddead(time)
    {
        //Dead array holds the place of the dead player in the
        //players array. If it holds more than two elements there is a tie
        //and it returns false
        //Dead is sorted by default
        this.dead=[];
        var deadnumber=0;
        for(var i=0;i<this.players.length;i++)
        {
            if(this.players[i].votes>deadnumber)
            {
                deadnumber=this.players[i].votes;
                this.dead=[];
                this.dead[0]=i;
            }
            else if(this.players[i].votes===deadnumber)
            {
                let pos=this.dead.length;
                this.dead[pos]=i;
            }
        }
        if(this.dead.length>1)
        {
            if(time = "day")
                await this.textchannel.send("There is a tie");
            else
                await this.assasinchannel.send("There is a tie");
            return false;
        }
        else
        {
            let pos=this.dead[0];
            if(time==="day")
            {
                this.players[pos].DeadDay=true;
            }
            this.textchannel.send(this.players[pos].Member.user.tag + " is Dead");
            this.players[pos].isDead=true;
            if(this.players[pos].isAssasin)
                this.assasincount--;
            else
                this.restcount--;
            this.assasinchannel.overwritePermissions(this.players[pos].id, { VIEW_CHANNEL: true });
            await this.printplayers();
            return true;
        }
    }

    async cleanvotes(votingtime)
    {
        for(var i = 0; i < this.players.length ; i++)
        {
            this.players[i].votes=0;
        }
        if(votingtime === "tie")
        {
            for(var i=0;i<this.dead.length;i++)
            {
                this.players[this.dead[i]].isTied=true;
            }
        }
        else if(votingtime==="day")
        {
            this.dead=[];
            for(var i=0;i<this.players.length;i++)
                this.players.isTied=false;
        }
    }
}

module.exports.Game=Game;