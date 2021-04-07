import { MinecraftPacketIds, nethook } from "bdsx";
import { Player } from "bdsx/bds/player";
import { cheats, punish } from "./punish";

nethook.before(MinecraftPacketIds.PlayerAction).on((pk, ni) => {
    if (pk.action === 13) {
        let gamemode = ni.getActor()!.as(Player).getGameType();
        if (gamemode !== 1 && gamemode !== 4) {
            punish(ni, cheats.InstaBreak);
        }
    }
});