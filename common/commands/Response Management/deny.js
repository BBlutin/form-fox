module.exports = {
	help: ()=> "Manually deny a response, in case reactions aren't working",
	usage: ()=> [' [response ID] - Manually denies the response with the given ID'],
	execute: async (bot, msg, args) => {
		if(!args[0]) return 'I need a response to deny!';

		var response = await bot.stores.responses.get(msg.channel.guild.id, args[0].toLowerCase());
		if(!response.id) return 'Response not found!';

		var user = await bot.users.fetch(response.user_id);
		if(!user) return "Couldn't get that response's user!";

		var post = await bot.stores.responsePosts.getByResponse(msg.channel.guild.id, response.hid);
		var chan = msg.channel.guild.channels.resolve(post?.channel_id);
		var message = await chan?.messages.fetch(post?.message_id);

		var reason;
		await msg.channel.send([
            'Quelle est la raison ?\n',
            'Pour passer, tapper `skip`, ou ',
            'pour annuler tapper `cancel` !'
        ].join(''));
		var resp = await msg.channel.awaitMessages({filter: m => m.author.id == msg.author.id, time: 2 * 60 * 1000, max: 1});
        if(!resp?.first()) return 'Erreur! Timed out!';
        resp = resp.first().content;
        if(resp.toLowerCase() == 'cancel') return 'Action annulée !';
        if(resp.toLowerCase() == 'skip') reason = '*(aucune raison spécifiée)*';
        else reason = resp;

		if(message) {
			var embed = message.embeds[0];
			embed.color = parseInt('aa5555', 16);
			embed.footer = {text: 'Candidature refusée !'};
			embed.timestamp = new Date().toISOString();
			try {
				await message.edit({embeds: [embed]});
				await message.reactions.removeAll();
			} catch(e) {
				return 'ERR! '+(e.message || e);
			}
		}

		try {
			response.status = 'denied';
			response = await response.save()
			await user.send({embeds: [{
				title: 'Candidature refusée !',
				description: [
					`Formulaire: ${response.form.name}`,
					`ID de candidature: ${response.hid}`
				].join("\n"),
				fields: [{name: 'Raison', value: reason}],
				color: parseInt('aa5555', 16),
				timestamp: new Date().toISOString()
			}]})
			bot.emit('DENY', response)
			await post.delete()
		} catch(e) {
			console.log(e);
			return 'ERR! Response denied, but couldn\'t message the user!';
		}

		return 'Candidature refusée !';
	},
	alias: ['fail'],
	permissions: ['MANAGE_MESSAGES'],
	opPerms: ['MANAGE_RESPONSES'],
	guildOnly: true
}