import { AttributeId } from "bdsx/bds/attribute";
import { ItemUseInventoryTransaction } from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

export default class FastEat extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Fast Eat
        description=Prevent players from eating too fast.

        suspect.generic=Ate [%1] in [%2] seconds.
    */};
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.InventoryTransaction), (pk, ni) => {
            if (pk.transaction?.isItemUseTransaction() && pk.transaction.actionType === ItemUseInventoryTransaction.ActionType.Use) {
                const player = ni.getActor()!;
                player.setAttribute(AttributeId.PlayerHunger, player.getAttribute(AttributeId.PlayerHunger));
            }
        });
    }
    unload(): void {
    }
}