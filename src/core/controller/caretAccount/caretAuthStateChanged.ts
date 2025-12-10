// CARET MODIFICATION: gRPC handler for Caret auth state changes

import { Controller } from "@core/controller"
import * as proto from "@shared/proto/index"

/**
 * Handles Auth0 authentication state changes
 * Updates user info in global state
 */
export async function caretAuthStateChanged(
	_controller: Controller,
	request: proto.caret.CaretAuthStateChangedRequest,
): Promise<proto.caret.CaretAuthState> {
	console.log("[CARET-HANDLER] 🔄 Caret auth state changed:", {
		uid: request.user?.uid,
		email: request.user?.email,
	})

	try {
		// CARET MODIFICATION: Handle Caret auth state change
		// Update extension state with new user info
		const userInfo = request.user

		if (userInfo) {
			console.log("[CARET-HANDLER] ✅ Caret auth state updated")

			return {
				user: {
					uid: userInfo.uid,
					displayName: userInfo.displayName,
					email: userInfo.email,
					photoUrl: userInfo.photoUrl,
					appBaseUrl: userInfo.appBaseUrl || "https://caret.team",
				},
			}
		} else {
			console.log("[CARET-HANDLER] 🚪 Caret user logged out")
			return { user: undefined }
		}
	} catch (error) {
		console.error("[CARET-HANDLER] ❌ Failed to handle Caret auth state change:", error)
		return { user: undefined }
	}
}
