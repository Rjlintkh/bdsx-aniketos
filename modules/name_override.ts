import { MinecraftPacketIds, nethook, NetworkIdentifier } from "bdsx";
import { cheats, punish } from "./punish";

const names = new Map<NetworkIdentifier, string>();

nethook.after(MinecraftPacketIds.Login).on((pk, ni) => {
    let cert = pk.connreq.cert;
    names.set(ni, cert.getIdentityName());
});

nethook.send(MinecraftPacketIds.PlayStatus).on((pk, ni) => {
    if (pk.status === 3) {
        if (ni.getActor()!.getName() !== names.get(ni)) {
            punish(ni, cheats.NameOverride);
        }
    }
});

NetworkIdentifier.close.on(ni => {
    names.delete(ni);
});