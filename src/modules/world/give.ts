import { InventoryAction, InventorySourceType, InventoryTransaction } from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { void_t } from "bdsx/nativetype";
import { hex } from "bdsx/util";
import { LL } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class Give extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Give
        description=Blocks Toolbox give and enchant, Horion give, nbt, rename, repair and enchant.

        suspect.Toolbox=Matched cheating-like container ids, the action will be cancelled if it really is.
        suspect.Horion=Matched hex of [02 9F 8D 06 09] at position [%s], the action will be cancelled if it really is.

        broadcast.cancelled=An inventory transaction is detected to be cheating and is cancelled.
    */};
    load(): void {
        this.listen(events.packetRaw(MinecraftPacketIds.InventoryTransaction), (ptr, size, ni) => {
            ptr.move(1);
            const data = [];
            if (ptr.readVarInt()) {
                for (let i = 0; i < ptr.readVarUint(); i++) {
                    const id = ptr.readUint8();
                    const slots = [];
                    for (let i = 0; i < ptr.readVarUint(); i++) {
                        slots.push(ptr.readUint8());
                    }
                    data.push({
                        id,
                        slots,
                    });
                }
                if (data.length >= 3) {
                    if ((data[0].id === 28) &&
                        (data[1].id === 159) && (data[1].slots[0] === 9) &&
                        (data[2].slots.length === 0)) {
                            this.suspect(ni, this.translate("suspect.Toolbox"));
                    }
                }
            }
        });
        this.listen(events.packetRaw(MinecraftPacketIds.InventoryTransaction), (ptr, size, ni) => {
            const data = hex(ptr.readBuffer(size));
            const index = data.indexOf("02 9F 8D 06 09");
            if (index !== -1) {
                this.suspect(ni, this.translate("suspect.Horion", [index.toString()]));
            }
        });
        {
            const original = LL.hooking("?addAction@InventoryTransaction@@QEAAXAEBVInventoryAction@@@Z", void_t, null, InventoryTransaction, InventoryAction)
            ((transaction, action) => {
                if (action.source.type === InventorySourceType.NonImplementedFeatureTODO) {
                    action.source.type = InventorySourceType.ContainerInventory;
                    this.broadcast(this.translate("broadcast.cancelled"));
                }
                return original(transaction, action);;
            });
        }
    }
    unload(): void {
    }
}