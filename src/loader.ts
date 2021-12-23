import fs = require("fs");
import vm = require("vm");
import path = require("path");
import { CommandPermissionLevel } from "bdsx/bds/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { command } from "bdsx/command";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { Event } from "bdsx/eventtarget";
import { bedrockServer } from "bdsx/launcher";
import { bool_t, CxxString } from "bdsx/nativetype";
import { ModuleBase, ModuleConfig } from "./modules/base";
import { DB } from "./utils";
var JSONC = require("comment-json");

interface WhitelistEntry {
    type: "address" | "gamertag" | "uuid" | "xuid";
    value: string;
}

class Config {
    "enabled" = true;
    "print-logo" = true;
    "crash-clients" = false;
    "command" = true;
    "lang" = "en_US";
    "modules": Record<string, ModuleConfig> = {};
    "whitelist" = new Array<WhitelistEntry>();
    "whitelist-ops" = true;
    "console-log-suspect" = true;
}

export class Aniketos {
    config: Config;
    private modules: ModuleBase[] = [];
    private cachedModules: ModuleBase[] = [];
    private lang: Record<string, string> = {};
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
        fs.watchFile(path.join(__dirname, "../config.json"), this.reloadConfig);
        events.serverStop.on(() => {
            fs.unwatchFile(path.join(__dirname, "../config.json"), this.reloadConfig);
            for (const module of this.modules) {
                this.unloadModule(module);
            }
        });
        bedrockServer.afterOpen().then(() => {
            if (this.config["command"]) {
                const factory = command.register("aniketos", "Configures Aniketos anti-cheat.", CommandPermissionLevel.Operator);

                factory.overload((params, origin, output) => {
                    let message = `There are ${this.modules.length} modules active:`;
                    for (const module of this.modules) {
                        const info = module.info();
                        message += `\n - §5${info.name} §8(§av${info.version}§8)§r: §7${info.description}§r`;
                    }
                    message += `\nThere are ${this.cachedModules.length} modules inactive:`
                    for (const module of this.cachedModules) {
                        const info = module.info();
                        message += `\n - §5${info.name} §8(§cv${info.version}§8)§r: §7${info.description}§r`;
                    }
                    output.success(message);
                }, { action: command.enum("aniketos.list", { "list": 0 }) });

                factory.overload((params, origin, output) => {
                    const config = this.config.modules[params.module];
                    const module = this.cachedModules.find(m => m.info().name === params.module);
                    if (config && module) {
                        config.enabled = true;
                        this.saveConfig();
                        this.loadModule(module);
                        output.success(`Module ${params.module} has been enabled.`);
                    } else {
                        if (this.modules.find(m => m.info().name === params.module)) {
                            output.error(`Module ${params.module} is already loaded.`);
                        } else {
                            output.error(`Module ${params.module} cannot be found.`);
                        }
                    }
                }, { action: command.enum("aniketos.enable", { "enable": 0 }), module: CxxString });

                factory.overload((params, origin, output) => {
                    const config = this.config.modules[params.module];
                    const module = this.modules.find(m => m.info().name === params.module);
                    if (config && module) {
                        config.enabled = false;
                        this.saveConfig();
                        this.unloadModule(module);
                        output.success(`Module ${params.module} has been disabled.`);
                    } else {
                        if (this.cachedModules.find(m => m.info().name === params.module)) {
                            output.error(`Module ${params.module} is not loaded.`);
                        } else {
                            output.error(`Module ${params.module} cannot be found.`);
                        }
                    }
                }, { action: command.enum("aniketos.disable", { "disable": 0 }), module: CxxString });

                factory.overload((params, origin, output) => {
                    this.reloadConfig();
                    for (const module of this.modules) {
                        this.unloadModule(module);
                    }
                    const _cachedModules = [...this.cachedModules];
                    for (const module of _cachedModules) {
                        this.loadModule(module);
                    }
                    output.success(`Reloaded all modules.`);
                }, { action: command.enum("aniketos.reload", { "reload": 0 })});

                factory.overload((params, origin, output) => {
                    (this.config as any)[params.key] = params.value;
                    if (this.saveConfig()) {
                        output.success(`${params.key} has been changed.`);
                    } else {
                        output.error("Failed to save config.");
                    }
                }, { action: command.enum("aniketos.config", { "config": 0 }), key: command.enum("Key", 
                    {
                        "whitelist-ops": "whitelist-ops",
                        "console-log-suspect": "console-log-suspect",
                    }), value: bool_t});
                    
            }
            this.listen(events.packetSend(MinecraftPacketIds.Disconnect), (pk, ni) => {
                if (pk.message === "aniketos.hideDisconnectPacket") {
                    return CANCEL;
                }
            }) 
        });
    }

    events = {
        suspect: new Event<(event: Aniketos.ModuleEvent) => void | CANCEL>(),
        warn: new Event<(event: Aniketos.ModuleEvent) => void | CANCEL>(),
        punish: new Event<(event: Aniketos.ModuleEvent) => void | CANCEL>(),
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
        event.on(listener);
        events.serverStop.on(() => {
            event.remove(listener);
        });
    }

    loadModule(module: ModuleBase | null): void {
        if (module) {
            if (!module.info()) {
                const pairs = module.info.toString().slice(18, -1).match(/^ *\* *@.+: *.+/gm)!;
                const info = {} as any;
                for (const pair of pairs) {
                    const key = pair.match(/@.+(?=:)/)![0].substring(1);
                    const value = pair.match(/: *.+/)![0].replace(/: */, "");
                    info[key] = value;
                }
                module.info = () => info;
            }
            const name = module.info().name;
            const config = this.config["modules"][name];
            if (!config) {
                this.config["modules"][name] = new module.configModel();
                this.saveConfig();
            }
            (module as any).listeners = [];
            module.log = message => this.log(name.magenta + " " + message);
            module.listen = <T extends (...args: any[]) => any>(event: Event<T>, listener: T): void => {
                event.on(listener);
                (module as any).listeners.push([event, listener]);
            };
            (module as any).repairConfig = () => {
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
            (module as any).repairConfig();
            module.getCore = () => this;
            module.getConfig = () => {
                this.config["modules"][name];
                (module as any).repairConfig();
            }
            module.setConfig = config => {
                this.config["modules"][name] = config
                return this.saveConfig();
            };
            if (config && config.enabled === false) {
                const index = this.cachedModules.findIndex(m => m.info().name === module.info().name);
                index === -1 && this.cachedModules.push(module);
                return;
            }

            module.load();
            module.log("Loaded module.");
            this.modules.push(module);
            {
                const index = this.cachedModules.findIndex(m => m.info().name === module.info().name);
                index !== -1 && this.cachedModules.splice(index, 1);
            }
        }
    }
    unloadModule(module: ModuleBase | null): void {
        if (module) {
            for (const [event, listener] of (module as any).listeners as any[]) {
                event.remove(listener);
            }
            module.unload();
            module.log("Unloaded module.");
            this.cachedModules.push(module);
            {
                const index = this.modules.findIndex(m => m.info().name === module.info().name);
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