import { Mode } from "@shared/storage/types"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { t } from "@/caret/utils/i18n"
import CaretModelPicker from "../CaretModelPicker"
import { useClineAuth } from "@/context/ClineAuthContext"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { CaretAccountServiceClient } from "@/services/grpc-client"
import { EmptyRequest } from "@shared/proto/cline/common"

/**
 * Props for the CaretProvider component
 */
interface CaretProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
}

/**
 * The Caret provider configuration component
 */
export const CaretProvider = ({ showModelOptions, isPopup, currentMode }: CaretProviderProps) => {
  const { clineUser } = useClineAuth()
	const { navigateToAccount } = useExtensionState()

  const user = clineUser || undefined

  const handleLogin = () => {
    CaretAccountServiceClient.caretAccountLoginClicked(EmptyRequest.create()).catch((err) =>
      console.error(t("clineAccountInfoCard.loginError", "settings"), err),
    )
  }

  const handleShowAccount = () => {
		navigateToAccount()
	}
	
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 2 }}>
			<p style={{ color: "var(--vscode-descriptionForeground)", fontSize: 13, margin: 0 }}>
				{t("providers.caret.description", "settings")}
			</p>

      {user ? (
        <>
          <VSCodeButton appearance="secondary" onClick={handleShowAccount}>
            {t("clineAccountInfoCard.viewBillingAndUsage", "settings")}
          </VSCodeButton>
          {showModelOptions && <CaretModelPicker currentMode={currentMode} isPopup={isPopup} />}
        </>
      ) : (
        <>
        	<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <VSCodeButton appearance="primary" className="w-full" onClick={handleLogin} style={{ minWidth: "120px" }}>
              {t("providers.caret.login", "settings")}
            </VSCodeButton>
          </div>
        </>
      )}
		</div>
	)
}
