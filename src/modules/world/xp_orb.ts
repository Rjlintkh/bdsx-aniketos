import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

export default class XpOrb extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Xp Orb
        description=Blocks illegal XP orbs.

        suspect.generic=Spawned XP orbs of amount [%s].
    */};
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.SpawnExperienceOrb), (pk, ni) => {
            if (pk.amount === 5000) {
                this.suspect(ni, this.translate("suspect.generic", ["5000"]));
                return CANCEL;
            }
        });
    }
    unload(): void {
    }
}