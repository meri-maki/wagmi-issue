import Footer from "../../ui/Footer.jsx"
import "./Error.scss"

export default function Error() {
	function refreshPage() {
		window.location.reload(false)
	}
	return (
		<>
			<div id="content-wrap">
				<div id="stars"></div>
				<div id="stars2"></div>
				<div id="stars3"></div>
				<header className="header" id="header">
					<div className="header-container">
						<div className="header__logo">
							<a href="/">ToON.ORG</a>
						</div>
					</div>
				</header>
				<div className="error-page">
					<img src="./images/NEW_DESIGN/purchase/blur-blue-new.webp" className="absolute blue" />
					<img src="./images/blur/blur-pink.webp" className="absolute pink" />

					{/* <img src="./images/NEW_DESIGN/main/hero/coin/coin-1.webp" className="absolute coin-1 " />
				<img src="./images/NEW_DESIGN/main/hero/coin/coin-2.webp" className="absolute coin-2" />
				<img src="./images/NEW_DESIGN/main/hero/coin/coin-3.webp" className="absolute coin-3" />

				<img src="./images/NEW_DESIGN/main/hero/metal/metal-1.webp" className="absolute metal-1" />
				<img src="./images/NEW_DESIGN/main/hero/metal/metal-2.webp" className="absolute metal-2" />
				<img src="./images/NEW_DESIGN/main/hero/coin/coin-4.webp" className="absolute coin-4" />
 */}
					<img src="./images/error/error.webp" className="main" />
					<h2>Something went wrong...</h2>
					<button className="button" onClick={refreshPage}>
						<div className="gradient"></div>Reload
					</button>
				</div>
			</div>
			<footer className="footer" id="footer">
				<Footer />
			</footer>
		</>
	)
}
