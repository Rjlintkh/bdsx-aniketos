import { MinecraftPacketIds } from "../../bdsx/bds/packetids";
import { events } from "../../bdsx/event";

events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pk, ni) => {
    // console.log("AUTH", {
    //     pitch: pk.pitch,
    //     yaw: pk.yaw,
    //     pos: pk.pos,
    //     moveX: pk.moveX,
    //     moveZ: pk.moveZ,
    //     heaYaw: pk.heaYaw,
    //     inputFlags: pk.inputFlags,
    //     inputMode: pk.inputMode,
    //     playMode: pk.playMode,
    //     vrGazeDirection: pk.vrGazeDirection,
    //     tick: pk.tick,
    //     delta: pk.delta,
    // });
});