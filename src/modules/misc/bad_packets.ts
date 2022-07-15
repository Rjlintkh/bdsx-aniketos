import { DimensionId } from "bdsx/bds/actor";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { TextPacket } from "bdsx/bds/packets";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { int32_t, void_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";
import { ModuleBase, ModuleConfig } from "../base";

export default class BadPackets extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Bad Packets
        description=Detects packets with invalid data and some bug fixes.

        suspect.chat.messageTooLong=Chat message is longer than 512 characters.
        suspect.chat.invalidType=Chat message is not of type chat.
        suspect.chat.mismatchedNames=Chat author and player name do not match.
    */};

    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.Text), (pk, ni) => {
            if (pk.message.length > 512) {
                this.suspect(ni, this.translate("suspect.chat.messageTooLong"));
                pk.message = pk.message.substring(0, 512);
                return;
            }
            if (pk.type !== TextPacket.Types.Chat) {
                this.suspect(ni, this.translate("suspect.chat.invalidType"));
                pk.type = TextPacket.Types.Chat;
                return;
            }
            const name = ni.getActor()!.getName();
            if (pk.name !== name) {
                this.suspect(ni, this.translate("suspect.chat.mismatchedNames"));
                pk.name = name;
                return;
            }
        });
        {
            this.listen(events.packetBefore(MinecraftPacketIds.MoveActorAbsolute), (pk, ni) => {
                const player = ni.getActor()!;
                if (!player.isRiding()) return CANCEL;
            });
        }
        {
            const original = procHacker.hooking("?changeDimension@ServerPlayer@@UEAAXV?$AutomaticID@VDimension@@H@@@Z", void_t, null, ServerPlayer, int32_t)
            ((player, dimensionId: DimensionId) => {
                if (player.isSleeping()) player.setSleeping(false);
                return original(player, dimensionId);
            });
        }
    }
    unload(): void {
    }
}