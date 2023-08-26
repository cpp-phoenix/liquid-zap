// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

interface IAnkrProxy {
    function stakeAndClaimCerts() external payable;
}

interface IAnkrToken {
    function ratio() external view returns (uint256);
}

interface IERC20 {
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract LiquidContract is AxelarExecutable {

    AggregatorV3Interface internal dataFeed;
    IAxelarGasService public immutable gasService;

    address public ankrPoolContract;
    address public ankrTokenContract;
    address payable public odner;
    mapping(address => uint) receiptTokenMap;

    constructor(address _dataFeed, address _gateway, address _gasReceiver, address _ankrPoolContract, address _ankrTokenContract) AxelarExecutable(_gateway) {
        dataFeed = AggregatorV3Interface(
            _dataFeed
        );
        
        gasService = IAxelarGasService(_gasReceiver);

        ankrPoolContract = _ankrPoolContract;
        ankrTokenContract = _ankrTokenContract;
        odner = payable(msg.sender);
    }

    event SentMessage(string indexed destinationDomain, string recipient, bytes message);
    event ReceivedMessage(string indexed _srcChainId, string _srcAddress, bytes message);

    function claimToken() public {
        uint claimableToken = receiptTokenMap[msg.sender];
        require(claimableToken > 0, "No rewards to claim");
        receiptTokenMap[msg.sender] = 0;
        IERC20(ankrTokenContract).transfer(msg.sender, claimableToken);
    }

    function getLatestData() public view returns (uint) {
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return uint(answer);
    }

    function checkClaims() view external returns (uint) {
        return receiptTokenMap[msg.sender];
    }

    function initiateBridge() external payable {
        if(ankrPoolContract == address(0)) {
            revert("direct staking not supported");
        }
        _initiateBridge(msg.value, msg.sender);
    }

    function transferOut() external {
        odner.transfer(address(this).balance);
    }

    function transferOut(address tokenAddress, uint amount) external {
        IERC20(tokenAddress).transfer(odner, amount);
        odner.transfer(address(this).balance);
    }

    function initiateXStaking(string calldata destChain, string calldata recipient) external payable {
        uint nativeTokenAmount = msg.value;
        uint nativeTokenUsdAmount = (nativeTokenAmount * getLatestData()) / 10e8;
        bytes memory message = abi.encode(nativeTokenUsdAmount, msg.sender);
        _sendMessage(destChain, recipient, message);
    }

    function _initiateBridge(uint nativeTokenAmount, address msgSender) private {
        IAnkrProxy(ankrPoolContract).stakeAndClaimCerts{gas: 2500000000, value: nativeTokenAmount}();
        uint receiptToken = (IAnkrToken(ankrTokenContract).ratio() * nativeTokenAmount / 10e18);
        receiptTokenMap[msgSender] = receiptToken;
        claimToken();
    }

    // To send message to multichain contract
    function _sendMessage(
        string calldata _destinationChain,
        string calldata _recipient,
        bytes memory _message
    ) private {

        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            _destinationChain,
            _recipient,
            _message,
            msg.sender
        );

        gateway.callContract(_destinationChain, _recipient, _message);
        emit SentMessage(_destinationChain, _recipient, _message);
    }


    function _execute(
        string calldata _srcChainId,
        string calldata _srcAddress,
        bytes calldata _message
    ) internal override {

        uint nativeTokenAmount;
        uint nativeTokenUsdAmount;
        address msgSender;

        (nativeTokenUsdAmount, msgSender) = abi.decode(_message,(uint, address));
        nativeTokenAmount = (nativeTokenUsdAmount / getLatestData()) * 10e8;
        _initiateBridge(nativeTokenAmount, msgSender);
        emit ReceivedMessage(_srcChainId, _srcAddress, _message);
    }

    receive() external payable {}
}