/* eslint-disable no-console */
import React, { Suspense } from "react"
import Error from "../../components/widgets/Error/Error.jsx"

// error boundary catches errors without full tree crashing
class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error) {
		// Update state so the next render will show the fallback UI.
		return { hasError: true }
	}

	componentDidCatch(error, errorInfo) {
		// You can also log the error to an error reporting service
		console.log(error, errorInfo)
	}

	render() {
		const { hasError } = this.state
		const { children } = this.props
		if (hasError) {
			// You can render any custom fallback UI

			return (
				<Suspense fallback="">
					<Error />
				</Suspense>
			)
		}

		return children
	}
}


export default ErrorBoundary
