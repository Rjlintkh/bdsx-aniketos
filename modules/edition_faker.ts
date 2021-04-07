import { MinecraftPacketIds, nethook } from "bdsx";
import { cheats, punish } from "./punish";

nethook.after(MinecraftPacketIds.Login).on((pk, ni) => {
    let cert = pk.connreq.cert;
    let something = pk.connreq.something;
    if (cert.json.value()["extraData"]["titleId"] === 896928775 && [1, 2, 4].includes(something.json.value()["DeviceOS"])) {
        punish(ni, cheats.EditionFaker);
    }
});