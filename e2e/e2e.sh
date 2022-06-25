#!/bin/bash

# caspermetrics.io production endpoint mainnet
caspermetrics_api="https://mainnet.cspr.art3mis.net"

# for testing we need synced mainnet node with available RPC 
main_net_node_ref='http://<NODE_IP:<RPC_PORT>'

# specify which era to put on the workbench
test_era="5123"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m'

# wait for confirmation, only accept 'y'
function Confirm() {

    echo -e "  ${CYAN}Press 'y' to continue ...${NC}"
    count=0

    while true; do

        read -n 1 k <&1

        if [[ "$k" = y ]]; then
            echo -e "\r\033[K"
            break
        fi

    done

}

# compare data from $caspermetrics_api with mainnet reference node, testing parameters: 'validators count, delegators count, switch block'
function validate_this_era() {

    # announcement
    echo && echo -e " Testing era ${GREEN}$test_era${NC}, reference mainnet node: ${YELLOW}$main_net_node_ref${NC}" && echo && Confirm

    # display '$test_era' data from $caspermetrics_api
    curl -s "$caspermetrics_api"/era?id="$1" | jq .[] && echo

    # get $test_era switch block from $caspermetrics_api
    test_era_switch_block=$(curl -s "$caspermetrics_api"/era?id="$1" | jq -r '.[] | .endBlock')

    echo -e " Era ${GREEN}$1${NC} switch block: ${GREEN}$test_era_switch_block${NC}" && echo
    echo -e " Pulling data from reference ..." && echo && Confirm

    # use get-era-info-by-switch-block and store json object in to variable
    switch_block_json=$(casper-client get-era-info-by-switch-block --node-address "$main_net_node_ref" -b "$test_era_switch_block")

    # calculate delegators and validators, this will fail if '$switch_block_json' is not switch
    echo " Validators count: $(echo "$switch_block_json" | jq '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Validator != null)) | length')"
    echo " Delegators count: $(echo "$switch_block_json" | jq '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Delegator != null)) | length')"

    # calculate validators rewards
    total_validators_rewards_motes=$(echo "$switch_block_json" | jq -r '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Validator != null)) | .[].Validator.amount' | paste -s -d + - | bc -l)
    total_delegators_rewards_motes=$(echo "$switch_block_json" | jq -r '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Delegator != null)) | .[].Delegator.amount' | paste -s -d + - | bc -l)

    # convert motes to cspr
    cspr_validators_rewards=$(echo "$total_validators_rewards_motes / 1000000000" | bc -l)
    cspr_delegators_rewards=$(echo "$total_delegators_rewards_motes / 1000000000" | bc -l)

    # cut decimals for clarity
    echo " Calculated validators reward: ${cspr_validators_rewards%.*}"
    echo " Calculated delegators reward: ${cspr_delegators_rewards%.*}" && echo

}

validate_this_era "$test_era"
