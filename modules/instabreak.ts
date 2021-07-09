import { Player } from "bdsx/bds/player";
import { MinecraftPacketIds } from "../../bdsx/bds/packetids";
import { events } from "../../bdsx/event";
import { cheats, punish } from "./punish";

events.packetBefore(MinecraftPacketIds.PlayerAction).on((pk, ni) => {
    if (pk.action === 13) {
        let gamemode = ni.getActor()!.as(Player).getGameType();
        if (gamemode !== 1 && gamemode !== 4) {
            punish(ni, cheats.InstaBreak);
        }
    }
});