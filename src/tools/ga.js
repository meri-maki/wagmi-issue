export const gaEvents = {
  ethConnect: "eth_connect",
  ethConnected: "eth_connected",
  ethConnectError: "eth_connect_error",
  cryptoSelect: "crypto_select",
  cryptoSelectButton: "crypto_select_button",
  scrollPlace: "scroll_place",
  purchaseSubmit: "purchase_submit",
  purchase: "purchase",
  purchaseSuccess: "purchase_success",
  purchaseFailure: "purchase_failure",
  purchaseTx: "purchase_transaction",
  purchaseError: "purchase_error",
  connectWalletButton: "connect_wallet_button",
};

export function gaSendEvent(eventName, eventParams) {
  window.gtag("send", eventName, eventName)
}