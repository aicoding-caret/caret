import { cn } from "@heroui/react"
import type { Decorator } from "@storybook/react-vite"
import React from "react"
import { CaretAuthContext, CaretAuthContextType, CaretAuthProvider, useCaretAuth } from "@/context/CaretAuthContext"
import { ClineAuthContext, ClineAuthContextType, ClineAuthProvider, useClineAuth } from "@/context/ClineAuthContext"
import {
	ExtensionStateContext,
	ExtensionStateContextProvider,
	ExtensionStateContextType,
	useExtensionState,
} from "@/context/ExtensionStateContext"
import { StorybookThemes } from "../../.storybook/themes"

// Component that handles theme switching
const ThemeHandler: React.FC<{ children: React.ReactNode; theme?: string }> = ({ children, theme }) => {
	React.useEffect(() => {
		const styles = theme?.includes("light") ? StorybookThemes.light : StorybookThemes.dark

		// Apply CSS variables to the document root
		const root = document.documentElement
		Object.entries(styles).forEach(([property, value]) => {
			root.style.setProperty(property, value)
		})

		document.body.style.backgroundColor = styles["--vscode-editor-background"]
		document.body.style.color = styles["--vscode-editor-foreground"]
		document.body.style.fontFamily = styles["--vscode-font-family"]
		document.body.style.fontSize = styles["--vscode-font-size"]

		return () => {
			// Cleanup on unmount
			Object.keys(styles).forEach((property) => {
				root.style.removeProperty(property)
			})
		}
	}, [theme])

	return <>{children}</>
}
function StorybookDecoratorProvider(className = "relative"): Decorator {
	return (story, parameters) => {
		return (
			<div className={className}>
				<ExtensionStateContextProvider>
					<ClineAuthProvider>
						<CaretAuthProvider>
							<ThemeHandler theme={parameters?.globals?.theme}>{React.createElement(story)}</ThemeHandler>
						</CaretAuthProvider>
					</ClineAuthProvider>
				</ExtensionStateContextProvider>
			</div>
		)
	}
}

// Wrapper component to safely use useExtensionState inside the provider
const ExtensionStateProviderWithOverrides: React.FC<{
	overrides?: Partial<ExtensionStateContextType>
	children: React.ReactNode
}> = ({ overrides, children }) => {
	const extensionState = useExtensionState()
	return <ExtensionStateContext.Provider value={{ ...extensionState, ...overrides }}>{children}</ExtensionStateContext.Provider>
}

const ClineAuthProviderWithOverrides: React.FC<{
	overrides?: Partial<ClineAuthContextType>
	children: React.ReactNode
}> = ({ overrides, children }) => {
	const authContext = useClineAuth()
	return <ClineAuthContext.Provider value={{ ...authContext, ...overrides }}>{children}</ClineAuthContext.Provider>
}

const CaretAuthProviderWithOverrides: React.FC<{
	overrides?: Partial<CaretAuthContextType>
	children: React.ReactNode
}> = ({ overrides, children }) => {
	const authContext = useCaretAuth()
	return <CaretAuthContext.Provider value={{ ...authContext, ...overrides }}>{children}</CaretAuthContext.Provider>
}

export const createStorybookDecorator =
	(
		overrideStates?: Partial<ExtensionStateContextType>,
		classNames?: string,
		authOverrides?: Partial<ClineAuthContextType>,
		caretAuthOverrides?: Partial<CaretAuthContextType>,
	) =>
	(Story: any) => (
		<ExtensionStateProviderWithOverrides overrides={overrideStates}>
			<ClineAuthProviderWithOverrides overrides={authOverrides}>
				<CaretAuthProviderWithOverrides overrides={caretAuthOverrides}>
					<div className={cn("max-w-lg mx-auto", classNames)}>
						<Story />
					</div>
				</CaretAuthProviderWithOverrides>
			</ClineAuthProviderWithOverrides>
		</ExtensionStateProviderWithOverrides>
	)

export const StorybookWebview = StorybookDecoratorProvider()
