import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { serverInstance } from "bdsx/bds/server";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class Freecam extends ModuleBase {
    info(): void {
        /**
         * @name: Freecam
         * @version: 1.0.0
         * @description: Detects if players stop sending packets.
         */
    }

    configModel = ModuleConfig;
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            const last = DB.getPlayerData(ni, "freecam.last") ?? 0;
            const laternacy = Date.now() - last - Utils.getPing(ni);
            if (last !== 0 && (laternacy > 1000)) {
                this.suspect(ni, `Client stopped sending movement packets for [${laternacy} ms].`);
                serverInstance.disconnectClient(ni, "disconnectionScreen.timeout");
            }
            DB.setPlayerData(ni, Date.now(), "freecam.last");
        });
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAction), (pk, ni) => {
            if (pk.action === PlayerActionPacket.Actions.Respawn || pk.action === PlayerActionPacket.Actions.DimensionChangeAck) {
                DB.setPlayerData(ni, 0, "freecam.last");
            }
        });
    }
    unload(): void {
    }
}