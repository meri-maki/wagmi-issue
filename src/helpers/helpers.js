/* ------------------------------- LOADED TIME ------------------------------ */

export const getTime = () => {
	const loadedMonth = new Date().getMonth() + 1
	const loadedDay = new Date().getDate()
	const loadedHour = new Date().getHours()
	const loadedMinutes = new Date().getMinutes()
	let time
	if (loadedMonth < 10 && loadedDay < 10) {
		time = "0" + loadedDay + "/0" + loadedMonth + " " + loadedHour + ":" + loadedMinutes
	} else if (loadedMonth < 10 && loadedDay > 9) {
		time = loadedDay + "/0" + loadedMonth + " " + loadedHour + ":" + loadedMinutes
	} else {
		time = loadedDay + "/" + loadedMonth + " " + loadedHour + ":" + loadedMinutes
	}
	return time
}

export const preventScroll = () => (document.documentElement.style.overflow = "hidden")
export const enableScroll = () => (document.documentElement.style.overflow = "auto")
