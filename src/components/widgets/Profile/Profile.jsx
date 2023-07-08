import { useAccount, useConnect, useDisconnect } from "wagmi"
import { useState } from "react"
import Modal from "../WalletModal/Modal.jsx"
import Notification from "../../ui/Notification.jsx"

import { enableScroll, preventScroll } from "../../../helpers/helpers.js"

export default function Profile() {
	const closeModal = () => {
		setModal(false)
		enableScroll()
	}

	const openModal = () => {
		setModal(true)
		preventScroll()
	}
	const { connector, isConnected } = useAccount()
	const { connect, connectors, error, isLoading, pendingConnector } = useConnect({
		onSuccess() {
			closeModal()
		},
	})
	const [modal, setModal] = useState(false) //FALSE
	const { disconnect } = useDisconnect()

	return (
		<div>
			{!isConnected && (
				<button className="button glass  connect-btn header-btn" onClick={openModal}>
					<div className="gradient"></div>
					Connect Wallet
				</button>
			)}
			{isConnected && connector && (
				<div>
					<Notification
						text={
							<div>
								You have <span className="bold">successfully</span> connected your wallet!
							</div>
						}
					/>
					<button className="button glass  connect-btn header-btn" onClick={() => disconnect()}>
						<div className="gradient"></div>
						Disconnect {connector.name}
					</button>
				</div>
			)}
			{modal && <Modal onClose={closeModal} connect={connect} connectors={connectors} error={error} />}
		</div>
	)
}
