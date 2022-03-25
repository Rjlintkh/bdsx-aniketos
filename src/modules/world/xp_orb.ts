import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { ActorEventPacket } from "bdsx/bds/packets";
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
        suspect.level=Give self [%s] levels of XP.
    */};
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.SpawnExperienceOrb), (pk, ni) => {
            if (pk.amount === 5000) {
                this.suspect(ni, this.translate("suspect.generic", ["5000"]));
                return CANCEL;
            }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.ActorEvent), (pk, ni) => {
            if (pk.event === ActorEventPacket.Events.PlayerAddXpLevels) {
                this.suspect(ni, this.translate("suspect.level", [pk.data+""]));
                return CANCEL;
            }
        });
    }
    unload(): void {
    }
}