import { Player } from "bdsx/bds/player";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { cheats, punish } from "./punish";

events.packetBefore(MinecraftPacketIds.AdventureSettings).on((pk, ni) => {
    if (pk.flag1 === 0x2E0 && pk.flag2 < 0x1BF) {
        let gamemode = ni.getActor()!.as(Player).getGameType();
        if (gamemode !== 3 && gamemode !== 4) {
            punish(ni, cheats.NoClip);
        }
    }
});