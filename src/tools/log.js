import mainconfig from "../config"

export const userEvents = {
	ethConnect: "eth_connect",
	ethConnectError: "eth_connect_error",
	ethConnected: "eth_connected",
	authorizedAccounts: "authorized_accounts",
	authorizedAccountsBalances: "authorized_accounts_balances",
	purchaseSuccess: "purchase_success", // old purhcase_success
	purchaseSubmit: "purchase_submit",
	purchaseRequest: "purchase_request", // old purhcase_request
	purchaseTx: "purchase_transaction",
	purchaseError: "purchase_error", // old purhcase_failure
	connectWalletButton: "connect_wallet_button",
	cryptoSelect: "crypto_select",
	cryptoSelectButton: "crypto_select_button",
	scrollPlace: "scroll_place",
	copyAddress: "copy_address",
	pageUnload: "page_unload",
	gotoBotClick: "goto_bot_click",
	survey: "survey",
}

export function logEvent(eventId, eventParams) {
	
		//console.log("logEvent", eventId, eventParams)
	

	fetch("https://toondao.com/events", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_token: mainconfig.clientToken,
			client_params: {},
			project_name: "toondao_com",
			event_name: eventId,
			event_params: eventParams,
			locale: mainconfig.locale,
		}),
	})
		.then((res) => {
			/* skip */
		})
		.catch((err) => {
			console.error(err)
		})
}

export function logEventOnce(eventId, params) {
	if (window.localStorage["logEvent_once_" + eventId] === "1") {
		return
	}

	window.localStorage["logEvent_once_" + eventId] = "1"

	logEvent(eventId, params)
}
