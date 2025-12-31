// CARET MODIFICATION: gRPC handler for mention image send setting.
import type { Controller } from "@/core/controller"
import { Logger } from "@/services/logging/Logger"
import * as proto from "@/shared/proto"

const SETTING_KEY = "caretMentionImageSendEnabled"

export async function GetMentionImageSendSetting(
	controller: Controller,
	_request: proto.caret.GetMentionImageSendSettingRequest,
): Promise<proto.caret.GetMentionImageSendSettingResponse> {
	try {
		const enabled = controller.context.globalState.get<boolean>(SETTING_KEY) ?? false
		return proto.caret.GetMentionImageSendSettingResponse.create({ enabled })
	} catch (error) {
		Logger.error("[GetMentionImageSendSetting] Failed to read setting", error as Error)
		return proto.caret.GetMentionImageSendSettingResponse.create({ enabled: false })
	}
}
