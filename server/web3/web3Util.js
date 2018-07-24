const _ = require('lodash');
const web3version = require('web3/package.json').version;
const Web3 = require('web3');

let _web3;
let _web3WithWsProvider;
let _web3Provider;
let _web3WebSocketProvider;

const HTTP_URL = "https://rinkeby.infura.io/v3/6b901e50131a4b69a46c6aad0294cb1d";
const WS_URL = "wss://rinkeby.infura.io/_ws";

console.log(HTTP_URL);
console.log(WS_URL);

const getWeb3 = () => {
    if(_.isUndefined(_web3)) {
        _web3 = new Web3(getWeb3Provider());
    }

    return _web3;
}

const getWeb3WithWsProvider = () => {
    if(_.isUndefined(_web3WithWsProvider)) {
        _web3WithWsProvider = new Web3(getWeb3WebSocketProvider());
    }

    return _web3WithWsProvider;
}

const getWeb3Provider = () => {
    if(_.isUndefined(_web3Provider)) {
        _web3WebSocketProvider = new Web3.providers.HttpProvider(HTTP_URL);
    }

    return _web3WebSocketProvider;
}

const getWeb3WebSocketProvider = () => {
    if(_.isUndefined(_web3Provider)) {
        _web3Provider = new Web3.providers.WebsocketProvider(WS_URL);
    }

    return _web3Provider;
}

module.exports = {
    web3version, getWeb3, getWeb3Provider, getWeb3WebSocketProvider, getWeb3WithWsProvider
}
