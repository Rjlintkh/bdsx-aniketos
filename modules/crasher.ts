import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { cheats, punish } from "./punish";

events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pk, ni) => {
    if ((pk.moveX === 4294967296 && pk.moveZ === 4294967296) || (pk.pos.x === 4294967296 && pk.pos.y === 4294967296 && pk.pos.z === 4294967296)) {
        punish(ni, cheats.Crasher);
    }
    return CANCEL;
});