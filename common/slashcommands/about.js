module.exports = {
	data: {
		name: "about",
		description: "Infos sur le bot"
	},
	usage: [
		"- Affiche des infos à propos du bot"
	],
	async execute(ctx) {
		return {embeds: [{
			title: '**A Propos**',
			description: "Eee! Moi c'est Steve ! Je suis chargé du secrétariat du Redline Performance :)",
			fields:[
				{name: "Créateur", value: "[bblutin](https://github.com/bblutin) | BBlutin#0831"},
				{name: "Mon site", value: `[Clicky!](https://tfritschy.dev)`,inline: true}
			]
		}]}
	},
	ephemeral: true
}