//Message displayed when the help commad is sent
const Discord = require('discord.js');//Location of discord library

module.exports = {
    help : "Send ;;start to begin the game" +
    "The players that play in the game are the ones in your voicechannel" +
    "If there is someone you don't want to join you can kick them later"
    ,
    print : function(message)
    {
        message.channel.send(this.help)
    }
}