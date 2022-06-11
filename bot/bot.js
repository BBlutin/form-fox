const {
	Client,
	Intents,
	Options,
	MessageAttachment,
	MessageEmbed
} = require("discord.js");
const fs				= require("fs");
const path				= require("path");
const Canvas 			= require("canvas");

require('dotenv').config();

const WelcomeMessage = "Hey [[user]] :champagne: \nBienvenue chez Redline Performance :checkered_flag:"

const bot = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
	],
	partials: [
		'MESSAGE',
		'USER',
		'CHANNEL',
		'GUILD_MEMBER',
		'REACTION'
	],
	makeCache: Options.cacheWithLimits({
		MessageManager: 0,
		ThreadManager: 0
	})
});

bot.prefix = process.env.PREFIX;
bot.chars = process.env.CHARS;
bot.invite = process.env.INVITE;

bot.tc = require('tinycolor2');

bot.status = 0;
bot.guildCount = 0;
bot.statuses = [
	() => `Redline Performance`,
	() => `social.tenezia.fr/redlineperf`
	// () => `servir ${bot.users.cache.size} membres`
	// `ff!h | https://ff.greysdawn.com`
];

bot.updateStatus = async function(){
	var target = bot.statuses[bot.status % bot.statuses.length];
	if(typeof target == "function") bot.user.setActivity(await target());
	else bot.user.setActivity(target);
	bot.status++;
		
	setTimeout(()=> bot.updateStatus(), 5000) // 5 sec
}

async function setup() {
	bot.db = await require(__dirname + '/../common/stores/__db')(bot);

	files = fs.readdirSync(__dirname + "/events");
	files.forEach(f => bot.on(f.slice(0,-3), (...args) => require(__dirname + "/events/"+f)(...args,bot)));

	bot.handlers = {};
	files = fs.readdirSync(__dirname + "/handlers");
	files.forEach(f => bot.handlers[f.slice(0,-3)] = require(__dirname + "/handlers/"+f)(bot));

	bot.utils = require(__dirname + "/utils");
	Object.assign(bot.utils, require(__dirname + "/../common/utils"));
}

bot.writeLog = async (log) => {
	let now = new Date();
	let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
	if(!fs.existsSync('./logs')) fs.mkdirSync('./logs');
	if(!fs.existsSync(`./logs/${ndt}.log`)){
		fs.writeFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err.stack);
		});
	} else {
		fs.appendFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to apend to log ${ndt}\n`+err);
		});
	}
}

bot.on("ready", async ()=> {
	console.log('fox ready!');
	bot.updateStatus();
})

bot.on('error', (err)=> {
	console.log(`Error:\n${err.stack}`);
	bot.writeLog(`=====ERROR=====\r\nStack: ${err.stack}`)
})

process.on("unhandledRejection", (e) => console.log(e));

setup();
bot.login(process.env.TOKEN)
.catch(e => console.log("Trouble connecting...\n"+e));

bot.on("guildMemberAdd", async member => {
	const channel = member.guild.channels.cache.find(ch => ch.id === "982693205214629937");
	console.log(channel)
	if (!channel) return;
	let role = member.guild.roles.cache.find(r => r.id === "985270038367981619");
	console.log(role)
	let background = await Canvas.loadImage("https://i.ibb.co/KjCWYF5/Sans-titre.png");
	let avatar = await Canvas.loadImage(
		member.user.displayAvatarURL({format: "png"})
	);
	let canvas = Canvas.createCanvas(800, 300);
	let ctx = canvas.getContext("2d");
	ctx.patternQuality = "bilinear";
	ctx.filter = "bilinear";
	ctx.antialias = "subpixel";
	ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
	ctx.shadowOffsetY = 2;
	ctx.shadowBlur = 2;
	ctx.stroke();
	ctx.beginPath();
	ctx.drawImage(background, 0, 0, 800, 300);
	ctx.font = "38px Arial Bold";
	ctx.fontSize = "72px";
	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "center";
	ctx.fillText(member.user.username, 540, 200);
	ctx.font = "16px Arial Bold";
	ctx.fontSize = "72px";
	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "center";
	ctx.fillText(``, 580, 200);
	ctx.beginPath();
	ctx.arc(169.5, 148, 126.9, -100, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();
	ctx.drawImage(avatar, 36, 21, 260, 260);
	let welcomeMsg = WelcomeMessage.replace("[[user]]", member.user);
	welcomeMsg = welcomeMsg.replace("[[server]]", member.guild.name);
	welcomeMsg = welcomeMsg.replace("[[members]]", member.guild.memberCount);
	let file = new MessageAttachment(canvas.toBuffer(), "welcome.png");

	const exampleEmbed = new MessageEmbed()
		.setColor('#0099ff')
		.setDescription(welcomeMsg)
		.setImage('attachment://welcome.png')
		.setTimestamp()
		.setFooter({
			text: 'Redline Performance',
			iconURL: 'https://cdn.discordapp.com/attachments/983167288935080006/984432040990625832/redline-3.png'
		});

	setTimeout(() => {
		// channel.send(welcomeMsg, file);
		channel.send({embeds: [exampleEmbed], files: [file]});
	}, 1000);

	if (role) return member.roles.add(role);
});