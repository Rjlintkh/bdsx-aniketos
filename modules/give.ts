import { hex } from "bdsx/util";
import { MinecraftPacketIds } from "../../bdsx/bds/packetids";
import { events } from "../../bdsx/event";
import { cheats, punish } from "./punish";

events.packetRaw(MinecraftPacketIds.InventoryTransaction).on((ptr, size, ni) => {
    if (hex(ptr.readBuffer(size)).slice(6, 14) === "01 1C 01") {
        punish(ni, cheats.Give);
    }
});

/*
legit
    1E BF 03 01 1C 01 00 02
    1E D7 03 01 1C 01 05 02
    1E DF 03 01 1C 01 05 02
unlegit
    1E 27 01 1C 01 20
    1E 2B 01 1C 01
    1E 43 01 1C 01 01
*/