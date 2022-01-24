import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { serverInstance } from "bdsx/bds/server";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class Freecam extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Freecam
        description=Detects if players stop sending packets.

        suspect.generic=Client stopped sending movement packets for [%s ms].
    */};
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if (DB.getPlayerData(ni, "Freecam.init")) {
                const last = DB.getPlayerData(ni, "Freecam.last") ?? 0;
                const laternacy = Date.now() - last - Utils.getPing(ni);
                if (last !== 0 && (laternacy > 3000)) {
                    this.suspect(ni, this.translate("suspect.generic", [laternacy.toString()]));
                    serverInstance.disconnectClient(ni, "disconnectionScreen.timeout");
                }
                DB.setPlayerData(ni, Date.now(), "Freecam.last");
             }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.SetLocalPlayerAsInitialized), (pk, ni) => {
            DB.setPlayerData(ni, true, "Freecam.init");
        });
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAction), (pk, ni) => {
            if (pk.action === PlayerActionPacket.Actions.Respawn || pk.action === PlayerActionPacket.Actions.DimensionChangeAck) {
                DB.setPlayerData(ni, 0, "Freecam.last");
            }
        });
    }
    unload(): void {
    }
}