import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NavLink as Link } from 'react-router-dom';

function Navbar () {
    return (
        <div className="bg-white flex items-center justify-between w-full h-20 px-12 border-b-2 border-blue-500">
            <Link className="flex flex-row space-x-4 items-center" to='/staking'>
                <img src="https://satellite.money/assets/ui/satellite.logo.svg" />
                <Link className="font-semibold text-2xl" to='/staking'>Liquid Zap</Link>
            </Link>
            <div className="space-x-36">
                {/* <Link className="font-normal hover:font-bold text-md" to='/'>Home</Link> */}
                {/* <Link className="font-normal hover:font-bold text-md" to='/staking'>Liquid Staking</Link> */}
                {/* <Link className="font-normal hover:font-bold text-md" to='/earn'>Earn</Link>  */}
            </div>
            <div className="">
                <ConnectButton chainStatus="icon" showBalance={false}/>
            </div>
        </div>
    )
}

export default Navbar;