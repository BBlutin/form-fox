module.exports = {
	data: {
		name: 'create',
		description: "Create a new form",
		options: [
			{
				name: 'name',
				description: "The form's name",
				type: 3,
				required: true
			},
			{
				name: 'description',
				description: "The form's description",
				type: 3,
				required: true
			}
		]
	},
	usage: [
		"[name] [description] - Creates a new form with the given name and description"
	],
	async execute(ctx) {
		var name = ctx.options.getString('name').trim();
		var description = ctx.options.getString('description').trim();

		var form = await ctx.client.stores.forms.create(ctx.guildId, {
			name,
			description,
			questions: []
		});

		return (
			`Formulaire créé ! ID: ${form.hid}` +
			"\n`/question add`" +
			"\n`/config channel`" +
			"\n `/form post`"
		)
	}
}