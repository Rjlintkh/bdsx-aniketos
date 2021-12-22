import { AbilitiesIndex } from "bdsx/bds/abilities";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

enum Flag1 {
    AutoJump = 0x20,
    AllowFlight = 0x40,
    NoClip = 0x80,
    WorldBuilder = 0x100,
    Flying = 0x200,
    Muted = 0x400,
}

export default class Flight extends ModuleBase {
    info(): void {
        /**
         * @name: Flight
         * @version: 1.0.0
         * @description: Detects illegal flying.
         */
    }

    configModel = ModuleConfig;
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.AdventureSettings), (pk, ni) => {
            if ((pk.flag1 & Flag1.AllowFlight) && (pk.flag1 & Flag1.Flying)) {
                const player = ni.getActor()!;
                const abilities = player.abilities;
                if (!abilities.getAbility(AbilitiesIndex.MayFly).value.boolVal) {
                    player.syncAbilties();
                    this.suspect(ni, "Setting self abilities to allow flight illegally.");
                    return CANCEL;
                }
            }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAction), (pk, ni) => {
            if (pk.action  === PlayerActionPacket.Actions.StartGlide) {
                this.suspect(ni, "Invoked gliding action from client, possibly Toolbox Elytra Fly.");
                return CANCEL;
            }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.MovePlayer), (pk, ni) => {
            if (pk.mode === 144) {
                this.suspect(ni, "Invalid player position mode [144], possibly Zephyr HiveFly.");
                return CANCEL;
            }
        });
    }
    unload(): void {
    }
}