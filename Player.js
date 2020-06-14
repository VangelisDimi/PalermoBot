const roles = require('./roleenum.js');

class player
{
    constructor(newmember)
    {
        this.isdead=false;
        this.Member=newmember;
        this.Role=this.Role;
        this.isDead=false;
        this.canVote=true;
        this.votes=0;
        this.DeadDay=false;
        this.isAssasin=false;
    }
    setRole(newrole)
    {
        this.Role=newrole;
        if(this.Role===roles.visible || this.Role===roles.hidden)
            this.isAssasin=true;
    }
    RoleString()
    {
        if(this.Role===roles.hidden) return "Hidden Assasin";
		else if(this.Role===roles.visible) return "Visible Assasin";
		else if(this.Role===roles.spy) return "Spy";
        else if(this.Role===roles.civilian) return "Civilian";
    }
    RevealRoles(Game)
    {
        if(this.isAssasin === true)
        {
            this.Member.send("Fellow Assassins:")
            Game.players.forEach(function(player){
                if(player.isAssasin && player.Member.user.tag!=this.Member.user.tag)
                    this.Member.send(`**${player.Member.user.tag}**`)
            });
        }
        else if(this.Role===roles.spy)
        {
            this.Member.send("Visible Assassins:")
            Game.players.forEach(function(player){
                if(player.Role===roles.visible)
                    this.Member.send(`**${player.Member.user.tag}**`)
            });
        }
    }
}

module.exports.player = player;