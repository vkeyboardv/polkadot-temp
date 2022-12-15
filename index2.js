const BN = require('bn.js');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { removePercentage, rmCommas, planckBnToUnit } = require('./utils');
const { NETWORKS } = require('./consts');

const units = NETWORKS.polkadot.units;

async function main() {
  const provider = new WsProvider(NETWORKS.polkadot.endpoints.rpc); // 'wss://rpc.polkadot.io/'

  const api = await ApiPromise.create({ provider });

  await api.isReady;

  const [now, validatorsSession, validatorsTotal, test] = await Promise.all([
    api.query.timestamp.now(),
    api.query.session.validators(),
    api.query.staking.validators.entries(),
    api.call.parachainHost.onChainVotes(),
  ]);

  console.log(`last block timestamp ${now.toNumber()}`);

  const activeEra = (await api.query.staking.activeEra()).toHuman();

  const erasStakers = await api.query.staking.erasStakers.entries(
    activeEra.index
  );

  const vActiveStakersMap = new Map(
    erasStakers.map(([_args, _prefs]) => {
      const address = _args.toHuman()[1];
      const prefs = _prefs.toHuman();

      const total = planckBnToUnit(new BN(rmCommas(prefs.total)), units);
      const own = planckBnToUnit(new BN(rmCommas(prefs.own)), units);
      const nominations = prefs.others.length;

      return [address, { total, own, nominations }];
    })
  );

  const v = [];

  for (const [_args, _prefs] of validatorsTotal) {
    const address = _args.args[0].toHuman();
    const prefs = _prefs.toHuman();
    const _commission = removePercentage(prefs.commission);

    const isActiveValidator = vActiveStakersMap.get(address);

    v.push({
      address,
      commission: parseFloat(_commission.toFixed(2)),
      blocked: prefs.blocked,
      grade: 'A',
      ownStake: isActiveValidator ? isActiveValidator.own : 0,
      totalStake: isActiveValidator ? isActiveValidator.total : 0,
      nominations: isActiveValidator ? isActiveValidator.nominations : 0,
    });
  }

  console.log('validatorsTotal', validatorsTotal.length);
  console.log('validatorsSession', validatorsSession.length);
  console.log(v[0]);
  console.log({ test: test.toHuman().backingValidatorsPerCandidate[0][1] });
}

main()
  .catch(console.error)
  .finally(() => process.exit());
