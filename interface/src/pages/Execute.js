import { useParams } from "react-router-dom";
import { useAccount, useNetwork, useBalance } from 'wagmi'
import { ethers } from 'ethers';
import { useSigner, useProvider } from "wagmi";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ankrChains, supportedChains } from '../constants';
import { useEffect, useState } from "react";
import { useAlert, positions } from 'react-alert';

function Execute () {

    const { data: signer } = useSigner();
    const { data: provider } = useProvider();

    let { chainId } = useParams();
    const {address, isConnected} = useAccount()
    const { chain } = useNetwork()
    const { data, isError, isLoading } = useBalance({
        address:address
    })
    const [inputAmount, setInputAmount] = useState(0);
    const [payAmount, setPayAmount] = useState(0);
    const [receiveAmount, setReceiveAmount] = useState(0);
    const alert = useAlert()

    const estimateAmount = (val) => {
        setInputAmount(val)
        fetch(`https://rest.coinapi.io/v1/exchangerate/${ankrChains[chainId].symbol}/USD`, {
            method: 'GET',
            headers: {
              'X-CoinAPI-Key': 'A4167619-513C-47F5-B35F-10FFF9EB297F',
            },
        })
        .then((response) => response.json())
        .then(async (data) => {
            const liquidStakingContract = new ethers.Contract(supportedChains[chain.id].liquidStakingContract, supportedChains[chain.id].liquidStakingABI, provider);
            const signedContract = liquidStakingContract.connect(signer);
            const sourceExRate = await signedContract.getLatestData();
            setPayAmount(((100000000 * val * data.rate)/(sourceExRate.toNumber())).toFixed(5))
            setReceiveAmount((val / ankrChains[chainId].ratio).toFixed(4))
        })
        .catch((err) => {
        console.log(err.message);
        });
    }

    const initiateBridge = async () => {
        if(inputAmount < ankrChains[chainId].minStake || payAmount <= 0) {
            alert.error(<div>input less than min stake</div>, {
                timeout: 6000,
                position: positions.BOTTOM_RIGHT
            });
        } else {
            console.log(chain.id)
            const liquidStakingContract = new ethers.Contract(supportedChains[chain.id].liquidStakingContract, supportedChains[chain.id].liquidStakingABI, provider);
            const signedContract = liquidStakingContract.connect(signer);
            const txnReceipt = await signedContract.initiateXStaking(ankrChains[chainId].chainId, ankrChains[chainId].liquidStakingContract, {value: ethers.utils.parseUnits(payAmount.toString(), "ether")})
            console.log(txnReceipt)
            alert.success(
                <div>
                    <div>transaction sent</div>
                    <button className='text-xs' onClick={()=> window.open("https://testnet.axelarscan.io/gmp/" + txnReceipt.hash, "_blank")}>View on explorer</button>
                </div>, {
                timeout: 0,
                position: positions.BOTTOM_RIGHT
            });
        }
    }

    if(!isConnected) {
        return (
            <div className='h-5/6 flex items-center justify-center'>
               <ConnectButton chainStatus="icon" showBalance={false}/>
            </div>
        )
    }

    return (
        <div className="flex w-content h-5/6 items-center justify-center">
            <div className="flex flex-col items-center rounded-[20px] w-6/12 h-5/6 bg-white p-14 px-20 space-y-4">
                <div className="text-3xl font-semibold">{ankrChains[chainId].serviceName.toUpperCase()} Liquid Staking </div>
                <div className="w-full space-y-2">
                    <div className="flex justify-between">
                        <div className="font-bold text-sm">{ankrChains[chainId].serviceName.toUpperCase() + " Amount"}</div>
                        <div className="text-xs text-gray-400">Your {chain.nativeCurrency.symbol.toUpperCase()} balance: {data?.formatted}</div>
                    </div>
                    <div>
                        <input onChange={(e) => {estimateAmount(e.target.value)}} type="number" className='w-full px-4 py-[18px] rounded-[8px] bg-gray-100 border-slate-300 text-md shadow-sm focux:bg-white focus:outline-none focus:border-2 focus:border-blue-600 focus:ring-1 focus:ring-sky-500' />
                    </div>
                </div>
                <div className="text-xs text-gray-400 w-full flex justify-end">
                    Min Stake: {ankrChains[chainId].minStake} {ankrChains[chainId].symbol}
                </div>
                <div className="rounded-[10px] flex space-x-6 border border-gray-100 border-2 p-4">
                    <img src={ankrChains[chainId].receiptImage}/> 
                    <div className="text-sm flex space-x-1">
                        <div> <span className="font-semibold">ankr{ankrChains[chainId].serviceName.toUpperCase()}</span> is a reward-bearing token. It accumulates rewards not by growing in number, by by growing in value in relation to {ankrChains[chainId].serviceName.toUpperCase()}. The redemption price of 1 <span className="font-semibold">ankr{ankrChains[chainId].serviceName.toUpperCase()}</span> is now <span className="font-semibold">{ankrChains[chainId].ratio} {ankrChains[chainId].serviceName.toUpperCase()}</span></div> 
                    </div>
                </div>
                <div className="w-full flex justify-between">
                    <div className="font-semibold text-sm">You will receive</div>
                    <div className="font-semibold text-sm"> {receiveAmount} ankr{ankrChains[chainId].serviceName.toUpperCase()}</div>
                </div>
                <div className="w-full flex justify-between">
                    <div className="font-semibold text-sm">You will pay</div>
                    <div className="font-semibold text-sm"> {payAmount} {chain.nativeCurrency.symbol.toUpperCase()}</div>
                </div>
                <button className="text-lg font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-[18px] w-full border py-4" onClick={() => {initiateBridge()}}>Initiate</button>
                <div className="text-sm text-gray-400">Source chain is <span className="font-semiibold text-black">{chain.name}</span></div>
            </div>
        </div>
    )
}

export default Execute;