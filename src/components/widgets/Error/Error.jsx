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
							<a href="/">TEST</a>
						</div>
					</div>
				</header>
				<div className="error-page">
					<h2>Something went wrong...</h2>
					<button className="button" onClick={refreshPage}>
						<div className="gradient"></div>Reload
					</button>
				</div>
			</div>
			<footer className="footer" id="footer"></footer>
		</>
	)
}
