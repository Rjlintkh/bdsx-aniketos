import { MinecraftPacketIds } from "../../bdsx/bds/packetids";
import { events } from "../../bdsx/event";
import { cheats, punish } from "./punish";

events.packetBefore(MinecraftPacketIds.SpawnExperienceOrb).on((pk, ni) => {
    punish(ni, cheats.XpOrb);
});