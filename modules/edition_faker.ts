import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { cheats, punish } from "./punish";

events.packetAfter(MinecraftPacketIds.Login).on((pk, ni) => {
    let connreq = pk.connreq;
    if (!connreq) return;
    let cert = connreq.cert;
    let something = connreq.something;
    if (cert.json.value()["extraData"]["titleId"] == 896928775 && [1, 2, 4].includes(something.json.value()["DeviceOS"])) {
        punish(ni, cheats.EditionFaker);
    }
});