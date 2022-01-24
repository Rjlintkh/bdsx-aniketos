import { CommandEnum, CommandOutput } from "bdsx/bds/command";
import { CommandOrigin } from "bdsx/bds/commandorigin";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { serverInstance } from "bdsx/bds/server";
import { Event } from "bdsx/eventtarget";
import { Type } from "bdsx/nativetype";
import { Aniketos } from "../loader";
import { DB, Utils } from "../utils";

interface CommandFieldOptions {
    optional?:boolean;
    description?:string;
    name?:string;
}

type GetTypeFromParam<T> =
    T extends CommandEnum<infer KEYS> ? KEYS :
    T extends Type<infer F> ? F :
    never;

type OptionalCheck<T, OPTS extends boolean|CommandFieldOptions> =
(OPTS extends true ? true : OPTS extends {optional:true} ? true : false) extends true ?
GetTypeFromParam<T> :
GetTypeFromParam<T>|undefined;

export class ModuleConfig {
    "enabled" = true;
}

export abstract class ModuleBase {
    configModel =  ModuleConfig;
    langModel = () => {};

    abstract load(): void;
    abstract unload(): void;

    info() {
        return {
            name: this.translate("name"),
            description: this.translate("description")
        }
    }
    
    translate(str: string, params: string[] = []): string {
        return this.translate(str, params);
    }
    log(message: string): void {
        this.log(message);
    }
    listen<T extends (...args: any[]) => any>(event: Event<T>, listener: T): void {
        this.listen(event, listener);
    }
    registerCommand<PARAMS extends Record<string, Type<any>|[Type<any>, CommandFieldOptions|boolean]>>(
        callback:(params:{
        [key in keyof PARAMS]:
            PARAMS[key] extends [infer T, infer OPTS] ? OptionalCheck<T, OPTS> :
            PARAMS[key] extends Type<any> ? GetTypeFromParam<PARAMS[key]> :
            never
        }, origin:CommandOrigin, output:CommandOutput)=>void,
    parameters?:PARAMS): void {
        this.registerCommand(callback, parameters);
    }
    getCore(): Aniketos {
        return this.getCore();
    }
    getConfig(): ModuleConfig | any {
        return this.getConfig();
    }
    setConfig(config: ModuleConfig | any): boolean {
        return this.setConfig(config);
    }

    broadcast(message: string): void {
        const ops = Utils.getOnlineOperators();
        for (const op of ops) {
            op.sendMessage(`§4[Aniketos] §5[${this.info().name}]§r ${this.getCore().translate("base.message.broadcast")} ${message}`);
        }
        this.log(`${this.getCore().translate("base.message.broadcast")} ${message}`);
    }
    suspect(player: NetworkIdentifier, message: string): void {
        const cancelled = this.getCore().events.suspect.fire(new Aniketos.ModuleEvent(player, this, message));
        if (!cancelled) {
            const ops = Utils.getOnlineOperators();
            for (const op of ops) {
                op.sendMessage(`§4[Aniketos] §5[${this.info().name}]§r ${this.getCore().translate("base.message.suspect", [`§8${DB.gamertag(player)}§r`])} ${message}`);
            }
            if (this.getCore().config["console-log-suspect"]) {
                this.log(`${this.getCore().translate("base.message.suspect", [`${DB.gamertag(player).gray}`])} ${message}`);
            }
        }
    }
    warn(player: NetworkIdentifier, message: string): void {
        const cancelled = this.getCore().events.warn.fire(new Aniketos.ModuleEvent(player, this, message));
        if (!cancelled) {
            player.getActor()!.sendMessage(`§4[Aniketos] §5[${this.info().name}]§r ${this.getCore().translate("base.message.warning")} ${message}`);
        }
    }
    punish(player: NetworkIdentifier, message: string): void {
        const cancelled = this.getCore().events.punish.fire(new Aniketos.ModuleEvent(player, this, message));
        if (!cancelled) {
            if (this.getCore().config["crash-clients"]) {
                Utils.crashClient(player);
            }
            serverInstance.disconnectClient(player, `§4[Aniketos]§r ${message}`);
        }
    }    
}