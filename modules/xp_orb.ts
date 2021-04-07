import { MinecraftPacketIds, nethook, serverInstance } from "bdsx";
import { cheats, punish } from "./punish";

nethook.before(MinecraftPacketIds.SpawnExperienceOrb).on((pk, ni) => {
    punish(ni, cheats.XpOrb);
});