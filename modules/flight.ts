import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { Cheats, punish } from "./punish";

// Toolbox Fly
events.packetBefore(MinecraftPacketIds.AdventureSettings).on((pk, ni) => {
    if (pk.flag1 === 0x260 && pk.flag2 < 0x1BF) {
        let gamemode = ni.getActor()!.as(Player).getGameType();
        if (gamemode === 0 || gamemode === 2) {
            punish(ni, Cheats.Flight);
        }
    }
});

// Toolbox Elytra Fly
events.packetBefore(MinecraftPacketIds.PlayerAction).on((pk, ni) => {
    if (pk.action === PlayerActionPacket.Actions.StartGlide) {
        punish(ni, Cheats.Flight);
    }
});

// Zephyr HiveFly
events.packetBefore(MinecraftPacketIds.MovePlayer).on((pk, ni) => {
    if (pk.mode === 144) {
        punish(ni, Cheats.Flight);
    }
});