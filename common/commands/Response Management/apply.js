const REACTS = require(__dirname + '/../../extras').confirmReacts;

module.exports = {
	help: ()=> 'Candidater à un championnat',
	usage: ()=> [' [form id] - Démarrez une candidature'],
	execute: async (bot, msg, args) => {
		var form;
		if(!args[0]) {
			form = await bot.stores.forms.getByApplyChannel(msg.guild.id, msg.channel.id);
			if(!form.id) return "Entrez un ID svp, ou utilisez cette commande dans le channel dédié!";
		} else {
			form = await bot.stores.forms.get(msg.channel.guild.id, args[0].toLowerCase());
			if(!form.id) return 'Formulaire non trouvé !';
		}

		// if(form.apply_channel && form.apply_channel != msg.channel.id) {
		// 	var message = await msg.channel.send(`This isn't the right channel for that form! Please apply in <#${form.apply_channel}>`);

		// 	setTimeout(async () => {
		// 		await msg.delete();
		// 		await message.delete();
		// 	}, 15000)
		// 	return;
		// }

		var cfg = await bot.stores.configs.get(msg.channel.guild.id);

		var resp = await bot.handlers.response.startResponse({
			user: msg.author,
			form,
			cfg
		});
		
		if(resp) return resp;
		else return;
	},
	alias: ['app', 'start', 'respond'],
	guildOnly: true
}
