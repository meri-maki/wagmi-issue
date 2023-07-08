import "../styles/helpers/_dev.scss"

window.onscroll = function () {
	let header = document.querySelector("header")
	if (header) {
		if (document.body.scrollTop > 30 || document.documentElement.scrollTop > 30) {
			header.classList.add("scrolled")
		} else {
			header.classList.remove("scrolled")
		}
	}
}

const scrollElements = document.querySelectorAll(".reveal")

let options = {
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

document.addEventListener("DOMContentLoaded", function () {
	scrollElements.forEach((el) => observer.observe(el))
})
