const { ApiPromise, WsProvider } = require('@polkadot/api');
const { NETWORKS } = require('./consts');

async function main() {
  const provider = new WsProvider(NETWORKS.polkadot.endpoints.rpc); // 'wss://rpc.polkadot.io/'

  const api = await ApiPromise.create({ provider });

  await api.isReady;

  const [
    validators,
    currentEpoch,
    currentEpochConfig,
    authorities,
    votes,
    test,
  ] = await Promise.all([
    api.query.session.validators(),
    api.call.babeApi.currentEpoch(),
    api.query.babe.epochConfig(),
    api.query.babe.authorities(),
    api.query.imOnline.authoredBlocks(
      5562,
      '13uW7auWPX9WAtqwkBx7yagb78PLcv8FAcPZEVCovbXoNJK4'
    ),
  ]);

  const hello = await api.queryMulti([api.query.society.candidates]);

  const _currentEpoch = currentEpoch.toHuman();
  const randomValidator = validators[0].toHuman();
  const randomAuthority = authorities.toHuman()[0][0];

  const temp = await api.query.imOnline.authoredBlocks(
    '1',
    '131FYgJpr6hTsNQyjSVchvVKV4H1uNSvGzR9hwimBhKsLVfA'
  );

  console.log(votes.toHuman());
  console.log(test.toHuman());
}

main()
  .catch(console.error)
  .finally(() => process.exit());
