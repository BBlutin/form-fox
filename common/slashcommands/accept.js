const VARIABLES = {
    '$USER': (user, guild) => user,
    '$GUILD': (user, guild) => guild.name,
    '$FORM': (user, guild, form) => form.name,
    '$FORMID': (user, guild, form) => form.id,
}

module.exports = {
	data: {
		name: 'accept',
		description: '',
		type: 3
	},
	description: "Accepter un formulaire",
	usage: [
		'Clique droit sur un message -> `accept`'
	],
	async execute(ctx) {
		var msg = ctx.options.getMessage('message');
		var post = await ctx.client.stores.responsePosts.get(ctx.guild.id, msg.channel.id, msg.id);
		if(!post) return "Only use this for a pending response message!";

		var u2 = await ctx.client.users.fetch(post.response.user_id);
        if(!u2) return "ERR! Couldn't fetch that response's user!";

		var embed = msg.embeds[0];
        embed.color = parseInt('55aa55', 16);
        embed.footer = {text: 'Réponse acceptée !'};
        embed.timestamp = new Date().toISOString();
        embed.author = {
        	name: `${ctx.user.username}#${ctx.user.discriminator}`,
        	iconURL: ctx.user.avatarURL()
        }

        try {
            post.response.status = 'accepted';
            post.response = await post.response.save()
            await msg.edit({embeds: [embed], components: []});
            await msg.reactions.removeAll();

            var welc = post.response.form.message;
            if(welc) {
                for(var key of Object.keys(VARIABLES)) {
                    welc = welc.replace(key, eval(VARIABLES[key]));
                }
            }

            await u2.send({embeds: [{
                title: 'Formulaire acceptée !',
                description: welc,
                fields: [
                	{name: 'Serveur', value: `${msg.channel.guild.name} (${msg.channel.guild.id})`},
                	{name: 'Formulaire', value: `${post.response.form.name}`},
                	{name: 'ID de réponse', value: `${post.response.hid}`}
                ],
                color: parseInt('55aa55', 16),
                timestamp: new Date().toISOString()
            }]});

            ctx.client.emit('ACCEPT', post.response);
            await post.delete()
        } catch(e) {
            console.log(e);
            return `ERR! ${e.message || e}\n(Response still accepted!)`;
        }

		return "Candidature acceptée !";
	},
	permissions: ['MANAGE_MESSAGES'],
	opPerms: ['MANAGE_RESPONSES']
}