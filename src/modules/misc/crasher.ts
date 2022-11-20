import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

const UINT32_MAX = 0xFFFFFFFF;

export default class Crasher extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "punish" = false;
    };
    langModel = () => {
    /*
        name=Crasher
        description=Blocks bad packets that crash the server.

        suspect.invalidCoordinates=Bad movement packet with invalid coordinates.
        suspect.arrayTooLong=Purchase Receipt packet with too many entries.

        suspect.type1=Horion Type 1 Crasher
        suspect.type2=Horion Type 2 Crasher

        punish.generic=Crasher is detected.
    */};

    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if ((pk.moveX > UINT32_MAX && pk.moveZ > UINT32_MAX) || (pk.pos.x > UINT32_MAX && pk.pos.y > UINT32_MAX&& pk.pos.z > UINT32_MAX)) {
                this.suspect(ni, this.translate("suspect.type1"));
                if (this.getConfig().punish) {
                    this.punish(ni, this.translate("punish.generic"));
                }
                return CANCEL;
            }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.MovePlayer), (pk, ni) => {
            if ((pk.pos.x > UINT32_MAX && pk.pos.y > UINT32_MAX && pk.pos.z > UINT32_MAX)) {
                this.suspect(ni, this.translate("suspect.type1"));
                if (this.getConfig().punish) {
                    this.punish(ni, this.translate("punish.generic"));
                }
                return CANCEL;
            }
        });
        this.listen(events.packetRaw(MinecraftPacketIds.PurchaseReceipt), (ptr, size, ni) => {
            ptr.move(1); // packet id
            const entriyLength = ptr.readVarUint();
            if (entriyLength >= UINT32_MAX) {
                this.suspect(ni, this.translate("suspect.type2"));
                if (this.getConfig().punish) {
                    this.punish(ni, this.translate("punish.generic"));
                }
            }
            return CANCEL;
        });
    }
    unload(): void {
    }
}