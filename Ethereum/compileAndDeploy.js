const path = require('path')
const solc = require('solc')
const fs = require('fs-extra')

const Web3 = require('web3')
const web3 = new Web3('http://localhost:8545')

function compile() {
	const buildPath = path.resolve(__dirname, 'build')
	fs.removeSync(buildPath)

	const handOffContractPath = path.resolve(
		__dirname,
		'contracts',
		'HandOff_SmartContracts.sol'
	)
	const contractSource = fs.readFileSync(
		handOffContractPath,
		'utf8'
	)

	const contractOutput = solc.compile(contractSource, 1).contracts

	const receiverStorage = contractOutput[':ReceiverStorage']
	const senderStorage = contractOutput[':SenderStorage']
	return { receiverStorage, senderStorage }
}

/* 
	Account 0 -- sender
	Account 1 -- receiver
 */

async function deploy() {
	const compiledContracts = compile()
	const { receiverStorage, senderStorage } = compiledContracts

	const { interface: receiverInterface, bytecode: receiverBytecode } = receiverStorage
	const { interface: senderInterface, bytecode: senderBytecode } = senderStorage
	
	const accounts = await web3.eth.getAccounts()

	const senderInstance = await new web3.eth.Contract(JSON.parse(senderInterface))
		.deploy({ data: senderBytecode })
		.send({ from: accounts[0], gas: '1000000' })

	const receiverInstance = await new web3.eth.Contract(JSON.parse(receiverInterface))
		.deploy({ data: receiverBytecode })
		.send({ from: accounts[1], gas: '1000000'})

	return {
		receiverInterface,
		receiverAddress: receiverInstance._address,
		senderInterface,
		senderAddress: senderInstance._address,
	}	
}

export default deploy