const DefaultParams = {
  auctionAdjust: 0,
  auctionMax: 0,
  falloff: 0.05,
  maxInflation: 0.1,
  minInflation: 0.025,
  stakeTarget: 0.5,
};

const NETWORKS = {
  polkadot: {
    name: 'Polkadot',
    endpoints: {
      rpc: 'wss://apps-rpc.polkadot.io',
    },
    subscanEndpoint: 'https://polkadot.api.subscan.io',
    unit: 'DOT',
    units: 10,
    ss58: 0,
    api: {
      unit: 'DOT',
      priceTicker: 'DOTUSDT',
    },
    params: {
      ...DefaultParams,
      stakeTarget: 0.75,
    },
  },
  kusama: {
    name: 'Kusama',
    endpoints: {
      rpc: 'wss://kusama-rpc.polkadot.io',
    },
    subscanEndpoint: 'https://kusama.api.subscan.io',
    unit: 'KSM',
    units: 12,
    ss58: 2,
    api: {
      unit: 'KSM',
      priceTicker: 'KSMUSDT',
    },
    params: {
      ...DefaultParams,
      auctionAdjust: 0.3 / 60,
      auctionMax: 60,
      stakeTarget: 0.75,
    },
  },
};

module.exports = { NETWORKS };
