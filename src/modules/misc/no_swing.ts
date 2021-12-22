import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { AnimatePacket } from "bdsx/bds/packets";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class NoSwing extends ModuleBase {
    info(): void {
        /**
         * @name: No Swing
         * @version: 1.0.0
         * @description: Tests if players did not swing their arms before performing certain actions.
         */
    }

    configModel = ModuleConfig;
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.Animate), (pk, ni) => {
            if (pk.action === AnimatePacket.Actions.SwingArm) {
                DB.setPlayerData(ni, Date.now(), "noswing.last");
            }
        });
        this.listen(events.blockDestructionStart, event => {
            const ni = event.player.getNetworkIdentifier();
            this.check(ni, "destroy");
        });
        this.listen(events.packetBefore(MinecraftPacketIds.LevelSoundEvent), (pk, ni) => {
            if (pk.sound === 42 && !pk.disableRelativeVolume) {
                if (this.check(ni, "hit air")) return CANCEL;
            }
        });
        this.listen(events.playerAttack, event => {
            const ni = event.player.getNetworkIdentifier();
            if (this.check(ni, "attack")) return CANCEL;
        });
    }
    unload(): void {
    }

    check(ni: NetworkIdentifier, action?: string): boolean {
        const lastSwing = DB.getPlayerData(ni, "noswing.last") ?? 0;
        if (lastSwing === 0) {
            this.suspect(ni, `No swing animation was found before action${action ? " [" + action + "]" : ""}.`);
            return true;
        }
        const laternacy = (Date.now() - lastSwing) - Utils.getPing(ni);
        if (laternacy > 1000) {
            this.suspect(ni, `Last swing animation before action${action ? " [" + action + "]" : ""} was too long ago, [${laternacy} ms].`);
            return true;
        }
        return false;
    }
}