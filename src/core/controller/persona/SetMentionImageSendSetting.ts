// CARET MODIFICATION: gRPC handler for updating mention image send setting.
import type { Controller } from "@/core/controller"
import { Logger } from "@/services/logging/Logger"
import * as proto from "@/shared/proto"

const SETTING_KEY = "caretMentionImageSendEnabled"

export async function SetMentionImageSendSetting(
	controller: Controller,
	request: proto.caret.SetMentionImageSendSettingRequest,
): Promise<proto.caret.SetMentionImageSendSettingResponse> {
	try {
		const enabled = request.enabled === true
		await controller.context.globalState.update(SETTING_KEY, enabled)
		Logger.info(`[SetMentionImageSendSetting] Updated mention image setting: ${enabled}`)
		return proto.caret.SetMentionImageSendSettingResponse.create({ enabled })
	} catch (error) {
		Logger.error("[SetMentionImageSendSetting] Failed to update setting", error as Error)
		return proto.caret.SetMentionImageSendSettingResponse.create({ enabled: false })
	}
}
