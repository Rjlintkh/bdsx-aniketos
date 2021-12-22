import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

export default class XpOrb extends ModuleBase {
    info(): void {
        /**
         * @name: Xp Orb
         * @version: 1.0.0
         * @description: Blocks illegal XP orbs.
         */
    }
    
    configModel = ModuleConfig;
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.SpawnExperienceOrb), (pk, ni) => {
            if (pk.amount === 5000) {
                this.suspect(ni, "Spawned XP orbs of amount [5000].");
                return CANCEL;
            }
        });
    }
    unload(): void {
    }
}