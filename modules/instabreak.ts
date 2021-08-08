import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { Cheats, punish } from "./punish";

events.packetBefore(MinecraftPacketIds.PlayerAction).on((pk, ni) => {
	if (pk.action === PlayerActionPacket.Actions.CreativePlayerDestroyBlock) {
		let gamemode = ni.getActor()!.as(Player).getGameType();
		if (gamemode !== 1 && gamemode !== 4) {
			punish(ni, Cheats.InstaBreak);
		}
	}
});
