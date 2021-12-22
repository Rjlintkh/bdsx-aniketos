import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

const UINT32_MAX = 0xFFFFFFFF;

export default class Crasher extends ModuleBase {
    info(): void {
        /**
         * @name: Crasher
         * @version: 1.0.0
         * @description: Blocks movement packets with invalid coordinates that crash the server.
         */
    }
    
    configModel = class Config extends ModuleConfig {
        "punish" = false;
    };
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if ((pk.moveX > UINT32_MAX && pk.moveZ > UINT32_MAX) || (pk.pos.x > UINT32_MAX && pk.pos.y > UINT32_MAX&& pk.pos.z > UINT32_MAX)) {
                this.suspect(ni, "Crasher is detected.");
                if (this.getConfig().punish) {
                    this.punish(ni, "Crasher is detected.");
                }
                return CANCEL;
            }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.MovePlayer), (pk, ni) => {
            if ((pk.pos.x > UINT32_MAX && pk.pos.y > UINT32_MAX&& pk.pos.z > UINT32_MAX)) {
                this.suspect(ni, "Crasher is detected.");
                if (this.getConfig().punish) {
                    this.punish(ni, "Crasher is detected.");
                }
                return CANCEL;
            }
        });
    }
    unload(): void {
    }
}