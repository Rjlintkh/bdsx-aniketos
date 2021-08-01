import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { Cheats, punish } from "./punish";

// This will also kick toolbox's Teleport to Player
events.packetBefore(MinecraftPacketIds.Interact).on((pk, ni) => {
    if (pk.action === 4) {
        let playerPos = ni.getActor()!.as(Player).getPosition();
        let targetPos = pk.pos;
        if (targetPos.x !== 0 && targetPos.y !== 0 && targetPos.z !== 0) {
            let dx = playerPos.x - targetPos.x;
            let dy = playerPos.y - targetPos.y;
            let dz = playerPos.z - targetPos.z;
            let d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d > 3) {
                punish(ni, Cheats.Reach);
            }
        }
    }
});