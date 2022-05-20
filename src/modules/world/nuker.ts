import { Block } from "bdsx/bds/block";
import { EnchantmentNames, EnchantUtils } from "bdsx/bds/enchants";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { Player } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class Nuker extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "threshold" = 1;
        "bypass-efficiency" = true;
        // "max-destructions-per-tick" = 3;
    };
    langModel = () => {
    /*
        name=Nuker
        description=Checks if players destroy blocks faster than expected time.

        suspect.instabreak=Invoked creative block destruction in survival mode.
        suspect.tooFast=Destroyed block [%1] in [%2 ticks] but expected to be [%3 ticks].
        suspect.tooMany=Destroyed [%1] blocks in [%2 ticks].
        suspect.didNotStart=Destroyed block [%1] before starting.
    */};

    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAction), (pk, ni) => {
            if (pk.action === PlayerActionPacket.Actions.CreativePlayerDestroyBlock) {
                if (!Utils.isCreativeLikeModes(ni.getActor()!)) {
                    this.suspect(ni, this.translate("suspect.instabreak"));
                    return CANCEL;
                }
            }
        });
        this.listen(events.blockDestructionStart, event => {
            if (!Utils.isCreativeLikeModes(event.player)) {
                const ni = event.player.getNetworkIdentifier();
                DB.setPlayerData(ni, Utils.getCurrentTick(), "Nuker.cracking");
            }
        });
        this.listen(events.blockDestroy, event => {
            const ni = event.player.getNetworkIdentifier();
            const currentTick = Utils.getCurrentTick();
            /*
            const lastDestroyTick = DB.getPlayerData(ni, "Nuker.lastDestroyTick");
            if (lastDestroyTick === currentTick) {
                const blocksDestroyedInTick = (DB.getPlayerData(ni, "Nuker.blocksBrokenInTick") ?? 0) + 1;
                console.log(blocksDestroyedInTick, currentTick);
                DB.setPlayerData(ni, blocksDestroyedInTick, "Nuker.blocksDestroyedInTick");
                if (blocksDestroyedInTick > this.getConfig()["max-destructions-per-tick"]) {
                    this.suspect(ni, this.translate("suspect.tooMany", [blocksDestroyedInTick+"", "1"]));
                    return CANCEL;
                }
            } else DB.setPlayerData(ni, 1, "Nuker.blocksDestroyedInTick");
            DB.setPlayerData(ni, currentTick, "Nuker.lastDestroyTick");
            */
            checks: {
                const startTick = DB.getPlayerData(ni, "Nuker.cracking");
                const block = event.blockSource.getBlock(event.blockPos);
                const player = ni.getActor()!;
                if (this.getConfig()["bypass-efficiency"] && EnchantUtils.hasEnchant(EnchantmentNames.Efficiency, player.getMainhandSlot())) break checks;
                if (startTick) {
                    const ticksNeeded = (this.getDestroyTime(event.player, block)) * 20;
                    const ticksUsed = currentTick - startTick + 1;

                    if (ticksUsed + (this.getConfig().threshold ?? 0) < ticksNeeded) {
                        this.suspect(ni, this.translate("suspect.tooFast", [block.getName(), ticksUsed+"", ticksNeeded+""]));
                        return CANCEL;
                    }
                } else {
                    if (!Utils.isCreativeLikeModes(event.player)) {
                        if (block.blockLegacy.getDestroyTime() !== 0) {
                            this.suspect(ni, this.translate("suspect.didNotStart", [block.getName()]));
                            return CANCEL;
                        }
                    }
                }
            }
            DB.setPlayerData(ni, 0, "Nuker.cracking");
        });
    }
    unload(): void {
    }

    getDestroyTime(player: Player, block: Block): number {
        const time = Math.round((
            (player.canDestroy(block) ?
                block.blockLegacy.getDestroyTime() * 1.5 :
                block.blockLegacy.getDestroyTime() * 5)
             + Number.EPSILON) * 1000) / 1000;
        const multiplier = player.getDestroySpeed(block);
        return time / multiplier;
    }
}