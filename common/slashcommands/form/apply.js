module.exports = {
	data: {
		name: 'apply',
		description: 'Candidater à un championnat',
		options: [{
			name: 'form_id',
			description: "L'identifiant du formulaire",
			type: 3,
			required: false,
			autocomplete: true
		}]
	},
	usage: [
		"[form_id] - Démarrer une candidature"
	],
	async execute(ctx) {
		var id = ctx.options.getString('form_id')?.toLowerCase().trim();
		var form;
		if(!id) {
			form = await ctx.client.stores.forms.getByApplyChannel(ctx.guild.id, ctx.channel.id);
			if(!form.id) return "Entrez un ID svp, ou utilisez cette commande dans le channel dédié!";
		} else {
			form = await ctx.client.stores.forms.get(ctx.guildId, id);;
			if(!form.id) return 'Formulaire non trouvé!';
		}

		if(form.apply_channel && form.apply_channel != ctx.channel.id)
		return `Ce n'est pas le bon channel pour ce formulaire ! Candidatez dans <#${form.apply_channel}>`;

		var cfg = await ctx.client.stores.configs.get(ctx.guildId);

		var resp = await ctx.client.handlers.response.startResponse({
			user: ctx.user,
			form,
			cfg
		});
		
		if(resp) return resp;
		else return;
	},
	async auto(ctx) {
		var forms = await ctx.client.stores.forms.getAll(ctx.guild.id);
		var foc = ctx.options.getFocused();
		if(!foc) return forms.map(f => ({ name: f.name, value: f.hid }));
		foc = foc.toLowerCase()

		if(!forms?.length) return [];

		return forms.filter(f =>
			f.hid.includes(foc) ||
			f.name.toLowerCase().includes(foc) ||
			f.description.toLowerCase().includes(foc)
		).map(f => ({
			name: f.name,
			value: f.hid
		}))
	},
	permissions: [],
	guildOnly: true,
	ephemeral: true
}