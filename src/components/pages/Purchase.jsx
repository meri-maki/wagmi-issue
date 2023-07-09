import { useAccount } from "wagmi"

import MintForm from "../widgets/MintForm/MintForm.jsx"
import Profile from "../widgets/Profile/Profile.jsx"

const Purchase = () => {
	const { isConnected } = useAccount()

	return (
		<>
			<div id="content-wrap">
				<header className="header" id="header">
					<div className="header-container">
						<Profile isConnected={isConnected} />
					</div>
				</header>
				<div className="buy">
					<div className="buy__body">
						<h2 className="buy__title">Mint</h2>
						<div className="buy__container">
							<div className="container__column column-input">
								<MintForm isConnected={isConnected} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default Purchase
