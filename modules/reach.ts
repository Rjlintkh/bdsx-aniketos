import { MinecraftPacketIds, nethook } from "bdsx";
import { Player } from "bdsx/bds/player";
import { cheats, punish } from "./punish";

nethook.before(MinecraftPacketIds.Interact).on((pk, ni) => {
    if (pk.action === 4) {
        let playerPos = ni.getActor()!.as(Player).getPosition();
        let targetPos = pk.pos;
        if (targetPos.x !== 0 && targetPos.y !== 0 && targetPos.z !== 0) {
            let dx = playerPos.x - targetPos.x;
            let dy = playerPos.y - targetPos.y;
            let dz = playerPos.z - targetPos.z;
            let d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            console.log(d)
            if (d > 3) {
                punish(ni, cheats.Reach);
            }
        }
    }
});