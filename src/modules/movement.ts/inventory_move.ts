import { AbilitiesIndex } from "bdsx/bds/abilities";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerAuthInputPacket } from "bdsx/bds/packets";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class InventoryMove extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Inventory Move
        description=Detects if players still move when opening inventory screens. (Does not work for Horion)

        suspect.generic=Player still moving when opening inventory screen.

        punish.generic=Do not move when opening inventory screen.
    */};
    
    load(): void {
        this.listen(events.packetSend(MinecraftPacketIds.ContainerOpen), (pk, ni) => {
            DB.setPlayerData(ni, true, "InventoryMove.open");
            const player = ni.getActor()!;
            player.abilities.setAbility(AbilitiesIndex.WalkSpeed, 0);
            player.syncAbilties();
        });
        this.listen(events.packetBefore(MinecraftPacketIds.ContainerClose), (pk, ni) => {
            DB.setPlayerData(ni, false, "InventoryMove.open");
            const player = ni.getActor()!;
            player.abilities.setAbility(AbilitiesIndex.WalkSpeed, 0.1);
            player.syncAbilties();
        });
        this.listen(events.packetAfter(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if (Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Up) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Down) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Left) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Right)) {
                if (DB.getPlayerData(ni, "InventoryMove.open")) {
                    this.suspect(ni, this.translate("suspect.generic"));
                    this.punish(ni, this.translate("punish.generic"));
                }
            }
        });
    }
    unload(): void {
    }
}