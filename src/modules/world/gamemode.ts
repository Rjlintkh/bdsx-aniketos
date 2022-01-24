import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { SetPlayerGameTypePacket } from "bdsx/bds/packets";
import { serverInstance } from "bdsx/bds/server";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

export default class Gamemode extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "punish" = false;
    };
    langModel = () => {
    /*
        name=Gamemode
        description=Blocks client-side gamemode setting.

        suspect.generic=Set self gamemode from [%1] to [%2].

        punish.generic=Do not spoof your gamemode.
    */};
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.SetPlayerGameType), (pk, ni) => {
            const gameType = ni.getActor()!.getGameType();
            this.suspect(ni, this.translate("suspect.generic", [gameType.toString(), pk.playerGameType.toString()]));
            if (this.getConfig().punish) {
                this.punish(ni, this.translate("punish.generic"));
            } else {
                serverInstance.nextTick().then(() => {
                    const pk = SetPlayerGameTypePacket.create();
                    pk.playerGameType = gameType;
                    pk.sendTo(ni);
                    pk.dispose();
                });
            }
            return CANCEL;
        });
    }
    unload(): void {
    }
}