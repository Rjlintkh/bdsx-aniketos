import { MinecraftPacketIds, nethook } from "bdsx";
import { Player } from "bdsx/bds/player";
import { cheats, punish } from "./punish";

nethook.before(MinecraftPacketIds.AdventureSettings).on((pk, ni) => {
    if (pk.flag1 === 0x260 && pk.flag2 < 0x1BF) {
        let gamemode = ni.getActor()!.as(Player).getGameType();
        if (gamemode === 0 || gamemode === 2) {
            punish(ni, cheats.Flight);
        }
    }
});