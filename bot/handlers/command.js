const { Collection } = require('discord.js');

class CommandHandler {
	cooldowns = new Map();

	constructor(bot) {
		this.bot = bot;

		this.bot.once('ready', () => {
			this.load(__dirname + "/../../common/commands");
			console.log('commands loaded!')
		})
	}

	load(path) {
		var modules = new Collection();
		var mod_aliases = new Collection();
		var commands = new Collection();
		var aliases = new Collection();

		var files = this.bot.utils.recursivelyReadDirectory(path);

		for(var f of files) {
			var path_frags = f.replace(path, "").split(/(?:\\|\/)/);
			var mod = path_frags.length > 1 ? path_frags[path_frags.length - 2] : "Unsorted";
			var file = path_frags[path_frags.length - 1];
			if(!modules.get(mod.toLowerCase())) {
				delete require.cache[require.resolve(f.replace(file, "/__mod.js"))];
				var mod_info = require(file == "__mod.js" ? f : f.replace(file, "__mod.js"));
				modules.set(mod.toLowerCase(), {...mod_info, name: mod, commands: new Collection()})
				mod_aliases.set(mod.toLowerCase(), mod.toLowerCase());
				if(mod_info.alias) mod_info.alias.forEach(a => mod_aliases.set(a, mod.toLowerCase()));
			}
			if(file == "__mod.js") continue;

			mod = modules.get(mod.toLowerCase());
			if(!mod) {
				console.log("Whoopsies");
				continue;
			}

			delete require.cache[require.resolve(f)];
			var command = require(f);
			command.module = mod;
			command.name = file.slice(0, -3).toLowerCase();
			command = this.registerSubcommands(command, mod);
			commands.set(command.name, command);
			mod.commands.set(command.name, command);
			aliases.set(command.name, command.name);
			if(command.alias) command.alias.forEach(a => aliases.set(a, command.name));
		}

		this.bot.modules = modules;
		this.bot.mod_aliases = mod_aliases;
		this.bot.commands = commands;
		this.bot.aliases = aliases;
	}

	async parse(str) {
		var args = str.trim().split(" ");

		if(!args[0]) return {};
	
		var command = this.bot.commands.get(this.bot.aliases.get(args[0].toLowerCase()));
		if(!command) return {command, args};

		args.shift();

		if(args[0] && command.subcommands?.get(command.sub_aliases.get(args[0].toLowerCase()))) {
			command = command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()));
			args.shift();
		}
		if(command.groupArgs) args = this.groupArgs(args);

		return {command, args};
	}

	async handle(ctx) {
		var {command, args, msg, config: cfg} = ctx;
		if(command.guildOnly && !msg.channel.guild) return "That command is guild only!";
		if(msg.channel.guild) {
			var check = this.checkPerms(ctx, cfg);
			if(!check) return "You don't have permission to use that command!";
		}
		if(command.cooldown && this.cooldowns.get(`${msg.author.id}-${command.name}`)) {
			var s = Math.ceil((this.cooldowns.get(`${msg.author.id}-${command.name}`) - Date.now()) / 1000)
			var m = await msg.channel.send(`Cool down time! Please wait **${s}s** before using this command`);
			setTimeout(() => m.delete(), s * 1000);
			return;
		}

		try {
			var res = await command.execute(this.bot, msg, args);
		} catch(e) {
			return Promise.reject(e);
		}

		if(command.cooldown) {
			this.cooldowns.set(`${msg.author.id}-${command.name}`, Date.now() + (command.cooldown * 1000));
			setTimeout(() => this.cooldowns.delete(`${msg.author.id}-${command.name}`), command.cooldown * 1000);
		}
		return res;
	}

	checkPerms(ctx, cfg) {
		var {command: cmd, msg} = ctx;
		if(!cmd.permissions?.[0]) return true;
		if(cmd.permissions && msg.member.permissions.has(cmd.permissions))
			return true;

		var found = this.findOpped(msg.member ?? msg.author, cfg?.opped)
		if(found && cmd.opPerms){			
			return (cmd.opPerms.filter(p => found.perms.includes(p))
					.length == cmd.opPerms.length);
		}
		return false;
	}

	findOpped(user, opped) {
		if(!opped || !user) return;

		var f = opped.users?.find(u => u.id == user.id);
		if(f) return f;

		if(user.roles) {
			f = opped.roles.find(r => user.roles.cache.has(r.id));
			if(f) return f;
		}

		return;
	}

	groupArgs(args) {
		if(typeof args == "object") args = args.join(" ");
		var nargs = [];
		var tmp;
		var regex = /[“”](.+?)[“”]|[‘’](.+?)[‘’]|"(.+?)"|'(.+?)'|(\S+)/gi;
		while(tmp = regex.exec(args)) {
			tmp.splice(1).forEach(m => { if(m) nargs.push(m); });
		}

		return nargs;
	}

	registerSubcommands(command, module, name) {	
		if(command.subcommands) {
			var subcommands = command.subcommands;
			command.subcommands = new Collection();
			Object.keys(subcommands).forEach(c => {
				var cmd = subcommands[c];
				cmd.name = `${command.name} ${c}`;
				cmd.parent = command;
				cmd.module = command.module;
				if(!command.sub_aliases) command.sub_aliases = new Collection();
				command.sub_aliases.set(c, c);
				if(cmd.alias) cmd.alias.forEach(a => command.sub_aliases.set(a, c));
				if(command.permissions && !cmd.permissions) cmd.permissions = command.permissions;
				if(command.guildOnly != undefined && cmd.guildOnly == undefined)
					cmd.guildOnly = command.guildOnly;
				command.subcommands.set(c, cmd);
			})
		}
		return command;
	}
}

module.exports = (bot) => new CommandHandler(bot);