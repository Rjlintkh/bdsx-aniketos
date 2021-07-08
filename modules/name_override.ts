import { NetworkIdentifier } from "../../bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "../../bdsx/bds/packetids";
import { events } from "../../bdsx/event";
import { cheats, punish } from "./punish";

const names = new Map<NetworkIdentifier, string>();

events.packetAfter(MinecraftPacketIds.Login).on((pk, ni) => {
    let cert = pk.connreq.cert;
    names.set(ni, cert.getIdentityName());
});

events.packetSend(MinecraftPacketIds.PlayStatus).on((pk, ni) => {
    if (pk.status === 3) {
        if (ni.getActor()!.getName() !== names.get(ni)) {
            punish(ni, cheats.NameOverride);
        }
    }
});

events.networkDisconnected.on(ni => {
    names.delete(ni);
});