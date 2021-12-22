import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { serverInstance } from "bdsx/bds/server";
import { Event } from "bdsx/eventtarget";
import { Aniketos } from "../loader";
import { DB, Utils } from "../utils";

export class ModuleConfig {
    "enabled" = true;
}

export abstract class ModuleBase {
    abstract info(): any;

    abstract load(): void;
    abstract unload(): void;

    configModel =  ModuleConfig;

    log(message: string): void {
        this.log(message);
    }
    listen<T extends (...args: any[]) => any>(event: Event<T>, listener: T): void {
        this.listen(event, listener);
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
            op.sendMessage(`§4[Aniketos] §5[${this.info().name}]§r Broadcast: ${message}`);
        }
        this.log(`Broadcast: ${message}`);
    }
    suspect(player: NetworkIdentifier, message: string): void {
        const cancelled = this.getCore().events.suspect.fire(new Aniketos.ModuleEvent(player, this, message));
        if (!cancelled) {
            const ops = Utils.getOnlineOperators();
            for (const op of ops) {
                op.sendMessage(`§4[Aniketos] §5[${this.info().name}]§r §8${DB.gamertag(player)}§r suspected: ${message}`);
            }
            if (this.getCore().config["console-log-suspect"]) {
                this.log(`${DB.gamertag(player).gray} suspected: ${message}`);
            }
        }
    }
    warn(player: NetworkIdentifier, message: string): void {
        const cancelled = this.getCore().events.warn.fire(new Aniketos.ModuleEvent(player, this, message));
        if (!cancelled) {
            player.getActor()!.sendMessage(`§4[Aniketos] §5[${this.info().name}]§r You are warned: ${message}`);
        }
    }
    punish(player: NetworkIdentifier, message: string): void {
        const cancelled = this.getCore().events.punish.fire(new Aniketos.ModuleEvent(player, this, message));
        if (!cancelled) {
            if (this.getCore().config["crash-clients"]) {
                //serverInstance.disconnectClient(player, `Aniketos.hideDisconnectPacket`);
            }
            serverInstance.disconnectClient(player, `§4[Aniketos]§r ${message}`);
        }
    }    
}