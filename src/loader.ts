import { CommandPermissionLevel } from "bdsx/bds/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { serverInstance } from "bdsx/bds/server";
import { command } from "bdsx/command";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { Event } from "bdsx/eventtarget";
import { bedrockServer } from "bdsx/launcher";
import { bool_t, CxxString } from "bdsx/nativetype";
import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";
import { ModuleBase, ModuleConfig } from "./modules/base";
import { DB, Utils } from "./utils";
var JSONC = require("comment-json");

interface WhitelistEntry {
    type: "address" | "gamertag" | "uuid" | "xuid";
    value: string;
}

class Config {
    "enabled" = true;
    "print-logo" = true;
    "crash-clients" = true;
	"no-console-spam" = true;
    "command" = true;
    "lang" = "en_US";
    "modules": Record<string, ModuleConfig> = {};
    "whitelist" = new Array<WhitelistEntry>();
    "whitelist-ops" = true;
    "console-log-suspect" = true;
}

class Language {
    unfinished = false;
    strings: Record<string, string> = {};
    constructor(raw: string, public locale: string = "en_US") {
        this.appendRaw(raw);
    }

    translate(str: string, params: string[] = []): string {
        return Utils.formatString(this.strings[str] ?? str, params);
    }

    appendRaw(raw: string, prefix: string = "") {
        const lines = raw.split("\n");
        for (const line of lines) {
            const m = /([^#=\s]+)=(.*)/g.exec(line);
            if (m) {
                const key = prefix + m[1];
                if (this.strings[key] === undefined) {
                    this.strings[key] = m[2];
                }
            }
        }
    }

    appendModuleLang(lang: () => void, label: string = "module.unknown") {
        const raw = lang.toString().slice(7,-1);
        this.appendRaw(raw, label + ".");
    }

    static parse(raw: string): Language {
        return new Language(raw);
    }

    static stringify(lang: Language): string {
        let ret = "";
        for (const key in lang.strings) {
            ret += `${key}=${lang.strings[key]}\n`;
        }
        return ret;
    }
}

export class Aniketos {
    config: Config;
    private modules: ModuleBase[] = [];
    private cachedModules: ModuleBase[] = [];
    private lang: Language;

    private langModel = () => {
    /**
        moduleLoaded=Loaded module.
        moduleUnloaded=Unloaded module.

        message.broadcast=Broadcast:
        message.suspect=Suspect %s:
        message.warning=You are warned:

        error.noLangFile=Language file for %s cannot be found, using default language instead.
        error.noDefaultLangFile=Default language file for %s cannot be found, generated it instead.

        command.desc=Configures Aniketos anti-cheat.
        command.error.moduleAlreadyLoaded=Module %s is already loaded.
        command.error.moduleNotLoaded=Module %s is not loaded.
        command.error.moduleNotFound=Module %s cannot be found.
        command.error.configSave=Failed to save config.
        command.output.activeModules=There are %s modules active:
        command.output.inactiveModules=There are %s modules inactive:
        command.output.moduleEnable=Module %s has been enabled.
        command.output.moduleDisable=Module %s has been disabled.
        command.output.moduleReload=Reloaded all modules.
        command.output.configChange=%s has been changed.

        module.command.desc.generic=Configures module %s of Aniketos.
    */};

    constructor() {
        this.reloadConfig();
        if (this.config["enabled"] === false) {
            return;
        }
        if (this.config["print-logo"]) {
            console.info("\n");
            console.info(`   (                  )          )          `.yellow);
            console.info(`   )\\          (   ( /(   (   ( /(          `.yellow);
            console.info(`((((_)(   (    )\\  )\\()) ))\\  )\\()) (   (   `.yellow);
            console.info(` )\\ `.yellow + `_`.red + ` )\\  )\\ )((`.yellow +  `_`.red + `)(`.yellow + `_`.red + `))\\ /((_)(`.yellow + `_`.red + `))/  )\\  )\\  `.yellow);
            console.info(` (_)`.yellow + `_\\`.red + `(_)`.yellow + `_`.red + `(`.yellow + `_`.red + `/( `.yellow + `(_)`.red + `| |`.red + `(`.yellow + `_`.red + `)(`.yellow + `_`.red + `)) `.yellow + `| |_`.red + `  ((`.yellow + `_`.red + `)((`.yellow + `_`.red + `) `.yellow);
            console.info(`  / _ \\ | ' \\`.red + `))`.yellow + `| || / / / -_)|  _|/ _ \\(_-< `.red);
            console.info(` /_/ \\_\\|_||_| |_||_\\_\\ \\___| \\__|\\___//__/ `.red);
            console.info("\n");
        }
        this.loadLanguage();
        fs.watchFile(path.join(__dirname, "../config.json"), this.reloadConfig);
        events.serverStop.on(() => {
            fs.unwatchFile(path.join(__dirname, "../config.json"), this.reloadConfig);
            for (const module of this.modules) {
                this.unloadModule(module);
            }
        });
        {
            // Evil stuff
            let lastLog = "";
            let spamCount = 1;

            const original = process.stdout.write.bind(process.stdout);
            process.stdout.write = (buffer: string, db: any) => {
                if (typeof buffer === "string" && lastLog === buffer && buffer.startsWith("Aniketos".red)) {
                    spamCount++;
                    if (this.config["no-console-spam"]) {
                        original("\x1b[A");
                        original("\x1b[K");
                        return original("[".gray + spamCount.toString().yellow + "]".gray + " " + buffer, db);
                    }
                } else {
                    spamCount = 1;
                }
                lastLog = buffer;
                return original(buffer, db);
            };
        }
        bedrockServer.afterOpen().then(() => {
            if (this.config["command"]) {
                const factory = command.register("aniketos", this.translate("base.command.desc"), CommandPermissionLevel.Operator);

                factory.overload((params, origin, output) => {
                    (this.config as any)[params.key] = params.value;
                    if (this.saveConfig()) {
                        output.success(this.translate("base.command.output.configChange", [params.key]));
                    } else {
                        output.error(this.translate("base.command.error.configSave"));
                    }
                }, { action: command.enum("aniketos.config", { "config": 0 }), key: command.enum("Key",
                    {
                        "whitelist-ops": "whitelist-ops",
                        "console-log-suspect": "console-log-suspect",
                    }), value: bool_t});

                factory.overload((params, origin, output) => {
                    const config = this.config.modules[params.module];
                    const module = this.modules.find(m => m.constructor.name === params.module);
                    if (config && module) {
                        config.enabled = false;
                        this.saveConfig();
                        this.unloadModule(module);
                        output.success(this.translate("base.command.output.moduleDisable", [params.module]));
                    } else {
                        if (this.cachedModules.find(m => m.constructor.name === params.module)) {
                            output.error(this.translate("base.command.error.moduleNotLoaded", [params.module]));
                        } else {
                            output.error(this.translate("base.command.error.moduleNotFound", [params.module]));
                        }
                    }
                }, { action: command.enum("aniketos.disable", { "disable": 0 }), module: CxxString });

                factory.overload((params, origin, output) => {
                    const config = this.config.modules[params.module];
                    const module = this.cachedModules.find(m => m.constructor.name === params.module);
                    if (config && module) {
                        config.enabled = true;
                        this.saveConfig();
                        this.loadModule(module);
                        output.success(this.translate("base.command.output.moduleEnable", [params.module]));
                    } else {
                        if (this.modules.find(m => m.constructor.name === params.module)) {
                            output.error(this.translate("base.command.error.moduleAlreadyLoaded", [params.module]));
                        } else {
                            output.error(this.translate("base.command.error.moduleNotFound", [params.module]));
                        }
                    }
                }, { action: command.enum("aniketos.enable", { "enable": 0 }), module: CxxString });

                factory.overload((params, origin, output) => {
                    let message = this.translate("base.command.output.activeModules", [this.modules.length.toString()]);
                    for (const module of this.modules) {
                        const info = module.info();
                        message += `\n - §5${info.name}§r: §7${info.description}§r`;
                    }
                    message += "\n" + this.translate("base.command.output.inactiveModules", [this.cachedModules.length.toString()]);
                    for (const module of this.cachedModules) {
                        const info = module.info();
                        message += `\n - §5${info.name}§r: §7${info.description}§r`;
                    }
                    output.success(message);
                }, { action: command.enum("aniketos.list", { "list": 0 }) });

                factory.overload((params, origin, output) => {
                    this.reloadConfig();
                    for (const module of this.modules) {
                        this.unloadModule(module);
                    }
                    const _cachedModules = [...this.cachedModules];
                    for (const module of _cachedModules) {
                        this.loadModule(module);
                    }
                    output.success(this.translate("base.command.output.moduleReload"));
                }, { action: command.enum("aniketos.reload", { "reload": 0 })});
            }
        });
    }

    events = {
        suspect: new Event<(event: Aniketos.ModuleEvent) => void | CANCEL>(),
        warn: new Event<(event: Aniketos.ModuleEvent) => void | CANCEL>(),
        punish: new Event<(event: Aniketos.ModuleEvent) => void | CANCEL>(),
    }

    private loadLanguage() {
        let locale = this.config.lang;
        if (fs.existsSync(path.join(__dirname, `./texts/${locale}.lang`))) {
            this.lang = Language.parse(fs.readFileSync(path.join(__dirname, `./texts/${locale}.lang`), "utf8"));
            this.lang.locale = locale;
        } else {
            locale = "en_US";
            if (fs.existsSync(path.join(__dirname, `./texts/${locale}.lang`))) {
                this.lang = Language.parse(fs.readFileSync(path.join(__dirname, `./texts/${locale}.lang`), "utf8"));
                this.log(this.translate("base.error.noLangFile", [locale]));
            } else {
                this.lang = new Language("", locale);
                this.lang.unfinished = true;
                this.lang.appendModuleLang(this.langModel, "base");
                this.log(this.translate("base.error.noDefaultLangFile", [locale]));
                try {
                    fs.writeFileSync(path.join(__dirname, `./texts/${locale}.lang`), Language.stringify(this.lang));
                } catch { }
            }
        }
    }

    private reloadConfig(): boolean {
        try {
            this.config = JSONC.parse(fs.readFileSync(path.join(__dirname, "../config.json"), "utf8"));
            const configModel = new Config;
            let modified = false;
            for (const prop in configModel) {
                if (!this.config.hasOwnProperty(prop)) {
                    (this.config as any)[prop] = (configModel as any)[prop];
                    modified = true;
                }
            }
            if (modified) {
                this.saveConfig();
            }
            return true;
        } catch {
            if (!this.config) {
                this.config = new Config;
                this.saveConfig();
                return true;
            }
        }
        return false;
    }

    private saveConfig() {
        try {
            fs.writeFileSync(path.join(__dirname, "../config.json"), JSONC.stringify(this.config, null, "\t"));
            return true;
        } catch {}
        return false;
    }

    translate(str: string, params: string[] = []): string {
        return this.lang.translate(str, params);
    }

    log(message: string): void {
        console.info("Aniketos".red, message);
    }

    getModuleFromFile(src: string): ModuleBase | null {
        const context = {
            exports: { default: void(0) as any },
            require: (id: string) => require(id.replace(/^\.\//, "./modules/")),
        };
        vm.createContext(context);
        try {
            vm.runInContext(src, context);
            return new context.exports.default();
        } catch {
            return null;
        }
    }

    checkWhitelisted(player: NetworkIdentifier): boolean {
        for (const entry of this.config.whitelist) {
            switch (entry.type) {
                case "address":
                    if (DB.address(player) === entry.value) {
                        return true;
                    }
                    break;
                case "gamertag":
                    if (DB.gamertag(player) === entry.value) {
                        return true;
                    }
                    break;
                case "uuid":
                    if (DB.uuid(player) === entry.value) {
                        return true;
                    }
                    break;
                case "xuid":
                    if (DB.xuid(player) === entry.value) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }

    listen<T extends (...args: any[]) => any>(event: Event<T>, listener: T): void {
        event.on(listener as any);
        events.serverStop.on(() => {
            event.remove(listener as any);
        });
    }

    loadModule(module: ModuleBase | null): void {
        if (module) {
            let _module = module as any;
            const name = module.constructor.name;
            const config = this.config["modules"][name];
            if (!config) {
                this.config["modules"][name] = new module.configModel();
                this.saveConfig();
            }
            this.lang.appendModuleLang(module.langModel, `modules.${name}`);
            // if (this.lang.unfinished) {
                try {
                    fs.writeFileSync(path.join(__dirname, `./texts/${this.lang.locale}.lang`), Language.stringify(this.lang));
                } catch { }
            // }
            _module.listeners = [];
            module.translate = (str, params) => this.translate(`modules.${name}.${str}`, params);
            module.log = message => this.log(module.info().name.magenta + " " + message);
            module.listen = <T extends (...args: any[]) => any>(event: Event<T>, listener: T): void => {
                event.on(listener as any);
                _module.listeners.push([event, listener]);
            };
            module.registerCommand = (callback, parameters) => {
                const cmdName = name.toLowerCase();
                bedrockServer.afterOpen().then(() => {
                    const signature = serverInstance.minecraft.getCommands().getRegistry().findCommand(cmdName);
                    if (signature) {
                        signature.permissionLevel = CommandPermissionLevel.Operator;
                    }
                    if (!_module.command) {
                        _module.command = command.register(cmdName, this.translate("base.module.command.desc.generic", [module.info().name]), CommandPermissionLevel.Operator);
                    }
                    _module.command.overload(callback, parameters ?? {});
                    serverInstance.updateCommandList();
                });
            }
            _module.repairConfig = () => {
                const configModel = new module.configModel;
                let modified = false
                for (const prop in configModel) {
                    if (!this.config.modules[name].hasOwnProperty(prop)) {
                        (this.config.modules[name] as any)[prop] = (configModel as any)[prop];
                        modified = true;
                    }
                }
                if (modified) {
                    this.saveConfig();
                }
            }
            _module.repairConfig();
            module.getCore = () => this;
            module.getConfig = () => {
                this.config["modules"][name];
                _module.repairConfig();
                return this.config["modules"][name];
            }
            module.setConfig = config => {
                this.config["modules"][name] = config
                return this.saveConfig();
            };
            if (config && config.enabled === false) {
                const index = this.cachedModules.findIndex(m => m.constructor.name === module.constructor.name);
                index === -1 && this.cachedModules.push(module);
                return;
            }

            module.load();
            module.log(this.translate("base.moduleLoaded"));
            this.modules.push(module);
            {
                const index = this.cachedModules.findIndex(m => m.constructor.name === module.constructor.name);
                index !== -1 && this.cachedModules.splice(index, 1);
            }
        }
    }
    unloadModule(module: ModuleBase | null): void {
        if (module) {
            let _module = module as any;
            for (const [event, listener] of _module.listeners as any[]) {
                event.remove(listener);
            }
            if (_module.command) {
                bedrockServer.afterOpen().then(() => {
                    const signature = serverInstance.minecraft.getCommands().getRegistry().findCommand(module.constructor.name.toLowerCase());
                    if (signature) {
                        signature.overloads.splice(0, signature.overloads.size());
                        signature.permissionLevel = CommandPermissionLevel.Internal;
                        serverInstance.updateCommandList();
                    }
                });
            }
            module.unload();
            module.log(this.translate("base.moduleUnloaded"));
            this.cachedModules.push(module);
            {
                const index = this.modules.findIndex(m => m.constructor.name === module.constructor.name);
                index !== -1 && this.modules.splice(index, 1);
            }
        }
    }
}

export namespace Aniketos {
    export class ModuleEvent {
        constructor(
            public networkIdentifier: NetworkIdentifier,
            public module: ModuleBase,
            public message: string,
        ) {
        }
    }
}