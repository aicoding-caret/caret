// CARET MODIFICATION: gRPC handler for subscribing to Caret auth status updates

import { CaretAuthService } from "@caret/services/auth/CaretAuthService"
import { Controller } from "@core/controller"
import * as proto from "@shared/proto/index"
import { StreamingResponseHandler } from "@/core/controller/grpc-handler"

/**
 * Subscribe to Caret Auth0 authentication status updates
 * Streams auth state changes to WebView
 */
export async function subscribeToCaretAuthStatusUpdate(
	controller: Controller,
	request: proto.cline.EmptyRequest,
	responseStream: StreamingResponseHandler<proto.caret.CaretAuthState>,
	_requestId?: string,
): Promise<void> {
	// Delegate to CaretAuthService so we stream real auth state (user info, logout, refresh)
	return CaretAuthService.getInstance(controller).subscribeToAuthStatusUpdate(controller, request, responseStream, _requestId)
}
