import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { Cheats, punish } from "./punish";

events.packetBefore(MinecraftPacketIds.SpawnExperienceOrb).on((pk, ni) => {
    punish(ni, Cheats.XpOrb);
    return CANCEL;
});

events.packetBefore(MinecraftPacketIds.ActorEvent).on((pk, ni) => {
    if (pk.event === 34) {
        punish(ni, Cheats.XpOrb);
        return CANCEL;
    }
});