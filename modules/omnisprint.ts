import { MinecraftPacketIds, nethook } from "bdsx";
import { Mob$isSprinting } from "../symbols";
import { cheats, punish } from "./punish";

nethook.before(MinecraftPacketIds.PlayerAuthInput).on((pk, ni) => {
    if (Mob$isSprinting(ni.getActor()) && pk.inputMode !== 1065353216 && pk.inputMode !== 1060439283) {
        punish(ni, cheats.OmniSprint);
    }
});