import React from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { t } from "../utils/i18n"

interface ButtonConfig {
	textKey: string
	handler: () => void
	appearance?: "primary" | "secondary"
	disabled?: boolean
}

interface CaretWelcomeSectionProps {
	headerKey: string
	bodyKey: string
	buttonConfig?: ButtonConfig
	className?: string
	children?: React.ReactNode
	allowHtml?: boolean
}

const CaretWelcomeSection: React.FC<CaretWelcomeSectionProps> = ({
	headerKey,
	bodyKey,
	buttonConfig,
	className = "",
	children,
	allowHtml = false,
}) => {
	const sectionStyle = {
		marginBottom: "15px",
		padding: "15px",
		border: "1px solid var(--vscode-settings-headerBorder)",
		borderRadius: "8px",
		backgroundColor: "var(--vscode-sideBar-background)",
		fontSize: "0.85rem",
	}

	return (
		<div className={`caret-welcome-section ${className}`} style={sectionStyle}>
			<h3 style={{ fontSize: "1rem", marginBottom: "8px" }}>{t(headerKey, "welcome")}</h3>
			{allowHtml ? <p dangerouslySetInnerHTML={{ __html: t(bodyKey, "welcome") }} /> : <p>{t(bodyKey, "welcome")}</p>}
			{children}
			{buttonConfig && (
				<VSCodeButton
					appearance={buttonConfig.appearance || "secondary"}
					onClick={buttonConfig.handler}
					disabled={buttonConfig.disabled || false}
					style={{ width: "100%", marginTop: "10px" }}>
					{t(buttonConfig.textKey, "welcome")}
				</VSCodeButton>
			)}
		</div>
	)
}

export default CaretWelcomeSection
