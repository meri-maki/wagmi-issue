import "./MintForm.scss"
import { useDebounce } from "use-debounce"
import { usePrepareSendTransaction, useSendTransaction, useWaitForTransaction } from "wagmi"
import { parseEther } from "viem"

import AnimateHeight from "react-animate-height"
import { useState } from "react"

export default function MintForm({ isConnected }) {
	const [purchaseError, setPurchaseError] = useState(false) //FALSE
	const [purchaseErrorMessage, setPurchaseErrorMessage] = useState("")

	const [amount, setAmount] = useState("")
	const [debouncedAmount] = useDebounce(amount, 400)

	const { config } = usePrepareSendTransaction({
		to: "0xe8078b5198e572be8d8d412511d48b7d0f5e9a1c",
		value: debouncedAmount ? parseEther(debouncedAmount) : undefined,
		onError(error) {
			if (error.name === "EstimateGasExecutionError") {
				console.log("Error", error.message)
			} else {
				console.log("Error", error.message)
				setPurchaseError(true)
				setPurchaseErrorMessage(error.message)
			}
		},
	})

	const { data, sendTransaction, isLoading } = useSendTransaction(config)

	const { isSuccess } = useWaitForTransaction({
		hash: data?.hash,
	})

	return (
		<form
			className="form reveal order-1"
			onSubmit={(e) => {
				e.preventDefault()
				console.log("send")
				sendTransaction?.()
			}}
		>
			<div className="input__wrapper">
				<input
					required
					name="amount"
					placeholder="0.00"
					type="number"
					className="input"
					step={0.000001}
					min={0.000001}
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
				/>
			</div>
			<button disabled={!isConnected} className="button full" type="submit">
				<div className="gradient"></div>
				{isLoading ? "Minting..." : "Mint"}
			</button>
			<div className="additional-notifications">
				<AnimateHeight style={{ flexShrink: 0, width: "100%" }} duration={500} height={isLoading ? "auto" : 0}>
					<div className="loading">Transaction confirmation</div>
				</AnimateHeight>
				<AnimateHeight style={{ flexShrink: 0, width: "100%" }} duration={500} height={purchaseError ? "auto" : 0}>
					<div className="error">{purchaseErrorMessage}</div>
				</AnimateHeight>
				<AnimateHeight style={{ flexShrink: 0, width: "100%" }} duration={500} height={purchaseStatus ? "auto" : 0}>
					<div className="status">
						Transaction status: <span>{purchaseStatusSpan}</span>
					</div>
				</AnimateHeight>
				<AnimateHeight style={{ flexShrink: 0, width: "100%" }} duration={500} height={isSuccess ? "auto" : 0}>
					<div className="thanks">
						<span>Thank you for your purchase!</span>
						<br />
						Remember that you can always check you transaction status on
						<a className="accent" href={isSuccess ? `https://etherscan.io/tx/${data?.hash}` : ""} target="_blank">
							<>&nbsp;</>Etherscan
						</a>
						.
					</div>
				</AnimateHeight>
			</div>
		</form>
	)
}
