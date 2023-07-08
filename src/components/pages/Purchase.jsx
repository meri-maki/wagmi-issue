import { useEffect, useRef, useState } from "react"

import { useAccount } from "wagmi"

import MintForm from "../widgets/MintForm/MintForm.jsx"
import Profile from "../widgets/Profile/Profile.jsx"

const Purchase = () => {
	/* ---------------------------- REVEAL ANIMATION ---------------------------- */
	const revealElements = useRef(null)
	const { isConnected } = useAccount()

	useEffect(() => {
		const elements = revealElements.current.querySelectorAll(".reveal")
		const options = {
			threshold: 0.1,
		}
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("animated")
					observer.unobserve(entry.target)
				}
			})
		}, options)
		elements.forEach((el) => observer.observe(el))

		return () => observer.disconnect()
	}, [])

	return (
		<>
			<div id="content-wrap" ref={revealElements}>
				<header className="header" id="header">
					<div className="header-container">
						<div className="header__logo">
							<a href="/">
								{" "}
								TEST
							</a>
						</div>
						<Profile isConnected={isConnected} />
					</div>
				</header>
				<div className="buy">
					<div className="buy__body">
						<h2 className="buy__title reveal">Mint</h2>
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
