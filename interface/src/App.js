import './App.css';
import '@rainbow-me/rainbowkit/styles.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';

import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { avalancheFuji, bscTestnet, fantomTestnet, polygonMumbai, polygonZkEvmTestnet, celoAlfajores } from '@wagmi/core/chains'
import { publicProvider } from '@wagmi/core/providers/public'
import Home from './pages/Home';
import Staking from './pages/Staking';
import Earn from './pages/Earn';
import Execute from './pages/Execute';
import Navbar from './components/Navbar';

const { chains, provider } = configureChains([celoAlfajores], [publicProvider()])

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  chains
});

const client = createClient({
  autoConnect: false,
  connectors,
  provider,
})

function App() {
  return (
    <WagmiConfig client={client}>
      <RainbowKitProvider chains={chains}>
        <div className="bg-gray-100 w-screen h-screen">
          <Router>
            <Navbar/>  
            <Routes>
              <Route path='/' exact element={<Staking/>}/>
              <Route path='/staking' exact element={<Staking/>}/>
              <Route path='/staking/:chainId' exact element={<Execute/>}/>
              <Route path='/earn' exact element={<Earn/>}/>
            </Routes>
          </Router>
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default App;