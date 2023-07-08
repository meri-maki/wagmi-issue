import "./Modal.scss"
import AnimateHeight from "react-animate-height"

export default function Modal({ onClose, connect, connectors, error }) {
	return (
		<div className="modal-container modal-container_wallet">
			<div className="modal">
				<h3 className="modal__title">choose one:</h3>
				<div className="modal__btns-container">
					{connectors.map((connector) => {
						return (
							<button style={{ display: connector.ready ? "flex" : "none" }} key={connector.id} onClick={() => connect({ connector })} className="modal__btn">
								<div className="gradient"></div>
								<h4>{connector.name}</h4>
								{connector.id === "metaMask" ? <p>Connect to your {connector.name} wallet</p> : <p>Use {connector.name} to connect</p>}
								<p>{!connector.ready && " (unsupported)"}</p>
							</button>
						)
					})}
				</div>
				<AnimateHeight style={{ flexShrink: 0, width: "100%" }} duration={500} height={error ? "auto" : 0}>
					{error && <div className="error">{error.message}</div>}
				</AnimateHeight>

				<button className="modal__close" onClick={onClose}>
					<div className="close" />
				</button>
			</div>
		</div>
	)
}
