module.exports = {
	data: {
		name: 'post',
		description: 'Posts a form in the given channel',
		options: [
			{
				name: 'form_id',
				description: 'The form\'s ID',
				type: 3,
				required: true,
				autocomplete: true
			},
			{
				name: 'channel',
				description: 'The channel to post in',
				type: 7,
				required: true,
				channel_types: [0, 5, 10, 11, 12]
			}
		]
	},
	usage: [
		"[form_id] [channel] - Post a form embed in a channel"
	],
	async execute(ctx) {
		var id = ctx.options.get('form_id').value.toLowerCase().trim();
		var chan = ctx.options.getChannel('channel');
		var form = await ctx.client.stores.forms.get(ctx.guildId, id);
		if(!form.id) return 'Form not found!';

		var responses = await ctx.client.stores.responses.getByForm(ctx.guildId, form.hid);
		try {
			var message = await chan.send({
				embeds: [{
					title: '🏁 ' + form.name + ' 🏁',
					description: form.description,
					color: parseInt(!form.open ? 'aa5555' : form.color || '55aa55', 16),
					fields: [{name: 'Nombre de candidatures :', value: responses?.length.toString() + '/5 places' || '0/5 places'}],
					footer: {
						text: `ID : ${form.hid} \n` +
							  (!form.open ?
							  '🔴 Les candidatures sont fermée pour l\'instant' :
							  '🟢 Appuyez sur le bouton pour soumettre une candidature !')
					}
				}],
				components: [{
					type: 1,
					components: [{
						type: 2,
						label: 'Candidature',
						emoji: form.emoji || "📝",
						style: 1,
						custom_id: `${form.hid}-apply`
					}]
				}]
			});
			var p = await ctx.client.stores.formPosts.create(ctx.guildId, chan.id, message.id, {
				form: form.hid
			});
		} catch(e) {
			return 'ERR! '+(e.message || e);
		}
		return 'Posted!';
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
	permissions: ['MANAGE_MESSAGES'],
	guildOnly: true
}