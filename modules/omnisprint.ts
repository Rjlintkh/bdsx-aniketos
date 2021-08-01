import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { Mob$isSprinting } from "../symbols";
import { Cheats, punish } from "./punish";

events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pk, ni) => {
    if (Mob$isSprinting(ni.getActor()) && pk.inputMode !== 1065353216 && pk.inputMode !== 1060439283) {
        punish(ni, Cheats.OmniSprint);
    }
});