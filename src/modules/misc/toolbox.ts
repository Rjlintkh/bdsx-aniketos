import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

export default class Toolbox extends ModuleBase {
    info(): void {
        /**
         * @name: Toolbox
         * @version: 1.0.0
         * @description: Fucks Toolbox players.
         */
    }

    configModel = ModuleConfig;
    
    load(): void {
        this.listen(events.packetAfter(MinecraftPacketIds.Login), (pk, ni) => {
            const connreq = pk.connreq;
            if (connreq) {
                const model = connreq.getJsonValue()!["DeviceModel"];
                const brand = model.split(" ")[0];
                if (brand.toUpperCase() !== brand) {
                    this.suspect(ni, "Toolbox is detected.");
                    this.punish(ni, "Use an unmodified client.");
                }
            }
        });
    }
    unload(): void {
    }
}