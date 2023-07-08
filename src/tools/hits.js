export const hits = {
  purchaseRequest: 8845,
  purchaseSuccess: 8846,
  purchaseError: 8847,
  continueByMetaMaskClick: 8965,
  continueByMetaMask: 8966,
  contractAddressCopied: 8851,
  contractAddressSelection: 8852,
  visit: 8915,
  visitWithMetamask: 8914,
  ethConnect: 8839,
  ethConnected: 8840,
  ethConnectError: 8843,
};

export function hit(id) {
  /* console.log("hit " + id); */
  new Image().src = "https://" + window.location.host + "/hit.php?id=" + id + "&r=" + Math.round(100000 * Math.random());
}

export function hitOnce(id) {
  if (window.localStorage["hit_once_" + id] === "1") {
    return;
  }

  window.localStorage["hit_once_" + id] = "1";

  hit(id);
}