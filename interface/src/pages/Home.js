import { NavLink as Link } from 'react-router-dom';

function Home () {
    return (
        <div className="flex flex-col w-full h-5/6 ">
            <div className="w-full h-1/2 flex items-end justify-center text-5xl font-semibold">
                Multichain liquid staking with a single click
            </div>
            <div className="flex items-center justify-center h-full space-x-4">
                <Link className="rounded-lg font-semibold bg-blue-500 text-white px-6 py-4 text-lg" to="/staking">Liquid Stake</Link>
                {/* <Link className="rounded-lg font-semibold bg-gray-200 text-blue-500 px-12 py-4 text-lg" to="/earn">Earn</Link> */}
            </div>
        </div>
    )
}

export default Home;