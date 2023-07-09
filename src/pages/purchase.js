import "../styles/helpers/resetNew.scss"
import "../styles/ui/index.scss"

import "../styles/purchase-page/purchase.scss"

import { createRoot } from "react-dom/client"
import { configureChains, createConfig, WagmiConfig, useAccount, useConfig } from "wagmi"
import { goerli, mainnet } from "wagmi/chains"
import { infuraProvider } from "wagmi/providers/infura"
import { publicProvider } from "wagmi/providers/public"
import { MetaMaskConnector } from "wagmi/connectors/metaMask"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"
import ErrorBoundary from "../providers/ErrorBoundary/ErrorBoundary.jsx"
import Purchase from "../components/pages/Purchase.jsx"
import mainconfig from "../config"

const infuraId = mainconfig.services.infura.key

const { chains, publicClient, webSocketPublicClient } = configureChains([mainnet, goerli], [infuraProvider({ apiKey: infuraId }), publicProvider()])

const config = createConfig({
	autoConnect: true,
	connectors: [
		new MetaMaskConnector({ chains }),
		new WalletConnectConnector({
			chains,
			options: {
				infuraId,
				projectId: mainconfig.services.walletconnect.key,
				qrcode: true,
				themeVariables: {
					"--wcm-font-family": "Inter, sans-serif",
					"--wcm-accent-color": "var(--primary-200)",
					"--wcm-overlay-background-color": "rgba(0, 0, 0, 0.6)",
				},
			},
		}),
	],
	publicClient,
	webSocketPublicClient,
})

const rootNode = document.getElementById("page-container")
const root = createRoot(rootNode)
root.render(
	<WagmiConfig config={config}>
		<ErrorBoundary>
			<Purchase />
		</ErrorBoundary>
	</WagmiConfig>
)
