import { AbilitiesIndex } from "bdsx/bds/abilities";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerAuthInputPacket } from "bdsx/bds/packets";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class InventoryMove extends ModuleBase {
    info(): void {
        /**
         * @name: InventoryMove
         * @version: 1.0.0
         * @description: Detects if players still move when opening inventory screens. (Does not work for Horion)
         */
    }

    configModel = ModuleConfig;
    
    load(): void {
        this.listen(events.packetSend(MinecraftPacketIds.ContainerOpen), (pk, ni) => {
            DB.setPlayerData(ni, true, "inventorymove.open");
            const player = ni.getActor()!;
            player.abilities.setAbility(AbilitiesIndex.WalkSpeed, 0);
            player.syncAbilties();
        });
        this.listen(events.packetBefore(MinecraftPacketIds.ContainerClose), (pk, ni) => {
            DB.setPlayerData(ni, false, "inventorymove.open");
            const player = ni.getActor()!;
            player.abilities.setAbility(AbilitiesIndex.WalkSpeed, 0.1);
            player.syncAbilties();
        });
        this.listen(events.packetAfter(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if (Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Up) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Down) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Left) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Right)) {
                    console.log("move")
                if (DB.getPlayerData(ni, "inventorymove.open")) {
                    this.suspect(ni, "Player still moving when opening inventory screen.");
                    this.punish(ni, "Stop moving in inventory screens.");
                }
            }
        });
    }
    unload(): void {
    }
}