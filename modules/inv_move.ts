import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";

const lock = new Map<NetworkIdentifier, boolean>();
events.packetSend(MinecraftPacketIds.ContainerOpen).on((pk, ni) => {
    lock.set(ni, true);
});

events.packetBefore(MinecraftPacketIds.ContainerClose).on((pk, ni) => {
    lock.set(ni, false);
});

// TODO: Plz do detect player movement, lazy myself

events.networkDisconnected.on(ni => {
    lock.delete(ni);
});

