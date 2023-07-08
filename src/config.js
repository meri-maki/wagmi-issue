
const isProduction = true

const mainconfig = {
	isProduction: isProduction,
	isMobile: /iphone|ipad|android/i.test(window.navigator.userAgent),
	isMetaMask: /metamask/i.test(window.navigator.userAgent), //testing whether the user's browser is running the MetaMask extension
	contract: {
		address: {
			mainnet: "0xE8078B5198E572Be8D8D412511d48b7D0f5E9a1c",
			goerli: "0x7E3BA0bCD192155ac7b9E51613C639e4e026d2dD",
		},
		abiPath: "./R2d2V0Extended.abi.json",
	},
	services: {
		walletconnect: {
			key: "08d390b3c49fa9c71e72aed16e58d580",
		},
		infura: {
			key: "5871ff536f3d43e59131d71f88c2b0b5",
		},
		amplitude: {
			key: "d12f46bfe20777d8e7ad7481e1446b46",
		},
	},
}

export default mainconfig
