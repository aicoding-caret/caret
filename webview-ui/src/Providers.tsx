import { HeroUIProvider } from "@heroui/react"
import { type ReactNode } from "react"
import { CustomPostHogProvider } from "./CustomPostHogProvider"
import { CaretAuthProvider } from "./context/CaretAuthContext"
import { ClineAuthProvider } from "./context/ClineAuthContext"
import { ExtensionStateContextProvider } from "./context/ExtensionStateContext"
import { PlatformProvider } from "./context/PlatformContext"

export function Providers({ children }: { children: ReactNode }) {
	return (
		<PlatformProvider>
			<ExtensionStateContextProvider>
				<CustomPostHogProvider>
					<ClineAuthProvider>
						<CaretAuthProvider>
							<HeroUIProvider>{children}</HeroUIProvider>
						</CaretAuthProvider>
					</ClineAuthProvider>
				</CustomPostHogProvider>
			</ExtensionStateContextProvider>
		</PlatformProvider>
	)
}
