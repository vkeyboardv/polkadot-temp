const { ApiPromise, WsProvider } = require('@polkadot/api');
const { NETWORKS } = require('./consts');
const fs = require('node:fs');

async function main() {
  const provider = new WsProvider(NETWORKS.polkadot.endpoints.rpc); // 'wss://rpc.polkadot.io/'
  // Create our API with a default connection to the local node
  const api = await ApiPromise.create({ provider });
  // const parachainValidators = (await api.call.parachainHost.validators()).toHuman();

  const { index: activeEra } = (await api.query.staking.activeEra()).toHuman(); // 1 era per 24h

  // current validators (addresses)
  const authorities = (await api.query.session.validators()).toHuman(); // 300 validators

  const activeValidatorIndices = (
    await api.query.parasShared.activeValidatorIndices()
  ).toHuman(); // 200 indeces (random)

  const eraRewardPoints = (
    await api.query.staking.erasRewardPoints(activeEra)
  ).toHuman();

  const validatorGroups = (
    await api.query.paraScheduler.validatorGroups()
  ).toHuman(); // 40 groups

  const backingVotes = (await api.call.parachainHost.onChainVotes()).toHuman();
  const session = Number(backingVotes.session.split(',').join(''));

  const backingValidatorsPerCandidate =
    backingVotes.backingValidatorsPerCandidate;

  const authoritiesGroups = {};

  // EpochKey(self.current_era, self.current_epoch), IT SHOULD BE FOR CURRENT EPOCH

  // * authorities
  const authoritiesSet = new Set();
  const authoritiesRecordsMap = new Map();

  // * para authorities
  const paraAuthoritiesSet = new Set();
  const paraAuthoritiesRecordsMap = new Map();

  // * adresses ??
  const addressesSet = new Set();

  // ? PART 1: TRACK RECORDS
  // https://github.com/turboflakes/one-t/blob/e720560127187c23514ac7cc79947cdbe4cc27f3/src/runtimes/polkadot.rs#L1000

  const scheduledCores = (await api.query.paraScheduler.scheduled()).toHuman();

  // ? PART 2: GET RECORD DATA STRUCTURES
  // for each validator
  for (let authIdx = 0; authIdx < authorities.length; authIdx++) {
    // check if it is para validator
    const authParaIdx = activeValidatorIndices.findIndex((v) => v == authIdx);

    // * set as default authority
    if (authParaIdx === -1) {
      const address = authorities[authIdx];
      const points = eraRewardPoints.individual[address] || 0;

      const authorityRecord = {
        index: authIdx,
        address,
        startPoints: points,
        endPoints: points,
      };

      authoritiesSet.add(authIdx);
      authoritiesRecordsMap.set(authIdx, authorityRecord);
    } else {
      // * set as para authority
      // for each validator group
      for (let groupIdx = 0; groupIdx < validatorGroups.length; groupIdx++) {
        const group = validatorGroups[groupIdx];

        if (group.includes(String(authParaIdx))) {
          for (const paraIdx of group) {
            if (activeValidatorIndices[Number(paraIdx)]) {
              const authIdx2 = activeValidatorIndices[Number(paraIdx)];

              if (authorities[Number(authIdx2)]) {
                const address = authorities[Number(authIdx2)];

                // -- temporary (INSERT_RECORDS_GROUPS) --
                if (authoritiesGroups[groupIdx]) {
                  authoritiesGroups[groupIdx].add(authIdx);
                } else {
                  authoritiesGroups[groupIdx] = new Set([authIdx]);
                }
                // -- temporary (INSERT_RECORDS_GROUPS) --

                const points = eraRewardPoints.individual[address] || 0;

                const authorityRecord = {
                  index: authIdx2, // was authIdx2
                  address,
                  startPoints: points,
                  endPoints: points,
                };

                const peers = group
                  .filter((v) => v !== paraIdx)
                  .map((v) => activeValidatorIndices[Number(v)]);

                const paraRecord = {
                  index: paraIdx,
                  authIdx,
                  groupIdx,
                  peers,
                };

                authoritiesSet.add(authIdx2);
                authoritiesRecordsMap.set(authIdx2, authorityRecord);

                paraAuthoritiesSet.add(authIdx2);
                paraAuthoritiesRecordsMap.set(authIdx2, paraRecord);

                addressesSet.add(address);
              }
            }
          }
        }
      }
    }
  }

  // console.log(insertGroupsMap);
  console.log({ authoritiesRecordsMap: authoritiesRecordsMap.size });
  console.log({ authoritiesSet: authoritiesSet.size });

  console.log({ paraAuthoritiesRecordsMap: paraAuthoritiesRecordsMap.size });
  console.log({ paraAuthoritiesSet: paraAuthoritiesSet.size });

  console.log({ addressesSetLength: addressesSet.size });

  // console.log({ session, backingValidatorsPerCandidate });

  // console.log(scheduledCores);

  // console.log(authoritiesGroups);

  // ? PART 3: ASSIGN GROUPIDX TO PARA RECORDS

  for (const coreAssignment of scheduledCores) {
    const { core, paraId, groupIdx } = coreAssignment;

    const authorityGroup = Array.from(authoritiesGroups[groupIdx]);

    if (authorityGroup.length) {
      for (let authIdx = 0; authIdx < authorityGroup.length; authIdx++) {
        const paraRecord = paraAuthoritiesRecordsMap.get(authIdx);

        if (paraRecord) {
          paraAuthoritiesRecordsMap.set(authIdx, {
            ...paraRecord,
            paraId,
            core,
          });
        }
      }
    }
  }

  // records with paraId
  console.log(
    [...paraAuthoritiesRecordsMap.values()]
  );

  fs.writeFileSync('authorities.json', JSON.stringify(authorities, null, 2));

  // ? PART 4: GET GRADES BASED ON PARA GROUPS
  for (let authIdx = 0; authIdx < authorities.length; authIdx++) {
    const paraRecord = paraAuthoritiesRecordsMap.get(authIdx);

    if (paraRecord) {
      // todo: udpate points https://github.com/turboflakes/one-t/blob/e720560127187c23514ac7cc79947cdbe4cc27f3/src/runtimes/polkadot.rs#L1117

      for (const [
        candidateReceipt,
        groupAuthorities,
      ] of backingValidatorsPerCandidate) {
        // Check if the para_id assigned to this authority got any on chain votes
        // Destructure ParaId
        const paraId = candidateReceipt.descriptor.paraId;

        // console.log(paraId, paraRecord.paraId);

        if (paraRecord.paraId === paraId) {
          console.log('bingo');
        } else {
          // inc missed votes

          paraAuthoritiesRecordsMap.set(authIdx, {
            ...paraRecord,
            stats: {
              missedVotes:
                paraRecord.stats && paraRecord.stats.missedVotes
                  ? paraRecord.stats.missedVotes++
                  : 1,
            },
          });
        }

        // console.log({ paraRecord });

        // console.log({ paraId });
      }
    }
  }

  // console.log(paraAuthoritiesRecordsMap);
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
