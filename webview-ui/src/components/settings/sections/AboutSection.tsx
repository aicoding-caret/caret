import { t } from "@/caret/utils/i18n"
import Announcement from "@/components/chat/Announcement"
import { useExtensionState } from "@/context/ExtensionStateContext"
import Section from "../Section"

interface AboutSectionProps {
	version: string
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

const AboutSection = ({ version, renderSectionHeader }: AboutSectionProps) => {
	const { version: stateVersion, setShowAnnouncement } = useExtensionState()
	const displayVersion = version || stateVersion

	return (
		<div>
			{renderSectionHeader("about")}
			<Section>
				<Announcement hideAnnouncement={() => setShowAnnouncement(false)} version={displayVersion} />
				<div className="flex flex-col items-center justify-center py-8">
					<p style={{ margin: 0, fontSize: "0.95rem" }}>CodeCenter Team | v{displayVersion}</p>
					<p style={{ margin: "6px 0 0", color: "var(--vscode-descriptionForeground)" }}>
						{t("footer.links.basedOnCline", "welcome")}
					</p>
				</div>
			</Section>
		</div>
	)
}

export default AboutSection
