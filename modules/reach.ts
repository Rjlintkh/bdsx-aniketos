import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DEBUG } from "./debug";

const lastPos = new Map<NetworkIdentifier, VectorXYZ>();

events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pk, ni) => {
    lastPos.set(ni, pk.pos.toJSON());
});

// This will also kick toolbox's Teleport to Player
events.packetBefore(MinecraftPacketIds.Interact).on((pk, ni) => {
    if (pk.action === 4) {
        let playerPos = lastPos.get(ni);
        if (playerPos) {
            let targetPos = pk.pos;
            if (targetPos.x !== 0 && targetPos.y !== 0 && targetPos.z !== 0) {
                let dx = playerPos.x - targetPos.x;
                let dy = playerPos.y - targetPos.y;
                let dz = playerPos.z - targetPos.z;
                let d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (DEBUG) {
                    console.log(`${"[Aniketos]".red} ${ni.getActor()?.getName()}'s reach : ${d}`);
                }
                if (d > 3) {
                    return CANCEL;
                    // punish(ni, Cheats.Reach);
                }
            }
        }
    }
});

events.networkDisconnected.on(ni => {
    lastPos.delete(ni);
});