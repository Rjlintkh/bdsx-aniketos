import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { Cheats, punish } from "./punish";

const lock = new Map<NetworkIdentifier, boolean>();
events.packetSend(MinecraftPacketIds.ContainerOpen).on((pk, ni) => {
	if (
		pk.type === /* ContainerType.BlastFurnace */ 27 ||
		pk.type === /* ContainerType.Furnace */ 2 ||
		pk.type === /* ContainerType.Smoker */ 28 ||
		pk.type === /* ContainerType.Grindstone */ 26
	) {
		lock.set(ni, true);
	}
});

events.packetBefore(MinecraftPacketIds.ContainerClose).on((pk, ni) => {
	lock.set(ni, false);
});

events.packetBefore(MinecraftPacketIds.SpawnExperienceOrb).on((pk, ni) => {
	if (!lock.get(ni)) {
		punish(ni, Cheats.XpOrb);
		return CANCEL;
	}
});

events.packetBefore(MinecraftPacketIds.ActorEvent).on((pk, ni) => {
	if (pk.event === 34) {
		punish(ni, Cheats.XpOrb);
		return CANCEL;
	}
});

events.networkDisconnected.on(ni => {
	lock.delete(ni);
});
