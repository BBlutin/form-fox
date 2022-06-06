module.exports = {
	data: {
		name: 'deny',
		description: '',
		type: 3
	},
	description: "Refuser un formulaire",
	usage: [
		'Clique droit sur le message -> `deny`'
	],
	async execute(ctx) {
		var msg = ctx.options.getMessage('message');
		var post = await ctx.client.stores.responsePosts.get(ctx.guild.id, msg.channel.id, msg.id);
		if(!post) return "Only use this for a pending response message!";

		var u2 = await ctx.client.users.fetch(post.response.user_id);
        if(!u2) return "ERR! Couldn't fetch that response's user!";

        var reason;
        await ctx.reply([
            'refuser le formulaire ?\n',
            'Saisi `skip [raison]` pour passer, ou ',
            '`cancel` pour annuler le refus !'
        ].join(''));
        var resp = await msg.channel.awaitMessages({filter: m => m.author.id == ctx.user.id, time: 2 * 60 * 1000, max: 1});
        if(!resp?.first()) return await msg.channel.send('Erreur ! Timed out!');
        resp = resp.first().content;
        if(resp.toLowerCase() == 'cancel') return await msg.channel.send('Action annulée!');
        if(resp.toLowerCase() == 'skip') reason = '*(aucune raison spécifié)*';
        else reason = resp;

		var embed = msg.embeds[0];
        embed.color = parseInt('aa5555', 16);
        embed.footer = {text: 'Formulaire refusé !'};
        embed.timestamp = new Date().toISOString();
        embed.author = {
            name: `${ctx.user.username}#${ctx.user.discriminator}`,
            iconURL: ctx.user.avatarURL()
        }

        try {
            post.response.status = 'denied';
            post.response = await post.response.save();
            await msg.edit({embeds: [embed], components: []});
            await msg.reactions.removeAll();

            await u2.send({embeds: [{
                title: 'Formulaire refusé !',
                description: [
                    `Serveur: ${msg.channel.guild.name} (${msg.channel.guild.id})`,
                    `Formulaire: ${post.response.form.name}`,
                    `ID de réponse: ${post.response.hid}`
                ].join("\n"),
                fields: [{name: 'Raison', value: reason}],
                color: parseInt('aa5555', 16),
                timestamp: new Date().toISOString()
            }]})

            ctx.client.emit('DENY', post.response);
            await post.delete();
        } catch(e) {
            console.log(e);
            return 'ERR! Response denied, but couldn\'t message the user!';
        }

		return "Response denied!";
	},
	permissions: ['MANAGE_MESSAGES'],
	opPerms: ['MANAGE_RESPONSES']
}