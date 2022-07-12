#!/bin/bash

set -o pipefail -e

caspermetrics_api="https://mainnet.cspr.art3mis.net"
main_net_node_ref="http://65.108.79.253:7777"

test_era="5125" # test this era

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m'

# test if RPC give valid output
function test_endpoints() {

    platform_height=$(curl -s "$caspermetrics_api"/block | jq .[].blockHeight)

    integer_check "$platform_height" "platform_height"

    reference_height=$(casper-client get-block --node-address "$main_net_node_ref" | jq -r .result.block.header.height)

    integer_check "$reference_height" "reference_height"

    # small sync jitter are normal, cache can introduce slight delay, or node can lag behind
    # we will check difference depends on who have greater block and then validate if this difference is acceptable or not
    if [[ $platform_height -gt $reference_height ]]; then
        height_diff=$((platform_height - reference_height))
        sync_leader="$caspermetrics_api" # store sync leader in case of failure
        sync_lagger="$main_net_node_ref" # store behind source for the same porpoise
    else
        height_diff=$((reference_height - platform_height))
        sync_leader="$main_net_node_ref" # store sync leader in case of failure
        sync_lagger="$caspermetrics_api" # store behind source for the same porpoise
    fi

    # display data
    echo -e " Platform height:  ${GREEN}$platform_height${NC}"
    echo -e " Reference height: ${GREEN}$reference_height${NC}"
    echo -e " Diff:             ${GREEN}$height_diff${NC}" && echo

}

# integers validation
function integer_check() {

    if ! [[ $1 =~ ^-?[0-9]+$ ]]; then
        echo -e " ${RED}ERROR:${NC} $2 ${RED}is not integer, test failed !${NC}"
        echo
        exit 1
    fi

    # echo -e " $2 ${GREEN}is integer:${NC} $1"; echo # DEBUG

}

# checking requirements - bc, jq, endpoint variables
function check_requirements() {

    echo

    requirements=0 # assume all packages are installed

    # test if platform link set
    if [ -z ${caspermetrics_api} ]; then
        echo -e " ${RED}ERROR: Platform API link is blank, test failed." && echo
        exit 1
    else
        echo -e " - platform API link point to:    ${GREEN}$caspermetrics_api${NC}"
    fi

    # test if reference node RPC set
    if [ -z ${caspermetrics_api} ]; then
        echo -e " ${RED}ERROR: Reference RPC link is blank, test failed." && echo
        exit 1
    else
        echo -e " - Reference RPC link point to:   ${GREEN}$main_net_node_ref${NC}"
    fi

    casper_client_version=$(casper-client --version | awk -F"[.]" '{print $2}')

    integer_check "$casper_client_version" "casper-client version"

    echo

    if [[ "$casper_client_version" -lt 5 ]]; then
        echo -e " ${RED}Requirement:${NC} casper-client version 1.5.x ${RED}or greater, exit for now.${NC}"
        echo
        exit 1
    else
        echo -e " - casper-client check ${GREEN}OK${NC}"
        echo
    fi

    # we need high precission calculator to calculate motes, bc perfectly serve our needs.
    if echo "4 + 3" | bc &>/dev/null; then
        echo -e " - bc check ${GREEN}OK${NC}"
    else
        echo -e " ${RED}- we need${NC} bc ${RED}presence, please install${NC} sudo apt install bc ${RED}or with appropriate package manager.${NC}"
        requirements=1 # indicate package is not on the system
    fi

    # we should be able to process JSON
    if echo '[{"test":"this"}]' | jq -s &>/dev/null; then
        echo -e " - jq check ${GREEN}OK${NC}"
    else
        echo -e " ${RED}- we need${NC} jq ${RED}presence, please install${NC} sudo apt install jq ${RED}or with appropriate package manager.${NC}"
        requirements=1 # indicate package is not on the system
    fi

    # evaluate
    if [[ "$requirements" -gt 0 ]]; then
        echo
        echo -e "    ${RED}Missing packages, for now exit.${NC}"
        echo
        exit 1
    fi

    echo

}

# validate timestamp
function validate_timestamp() {

    if ! date -d "$1" >/dev/null 2>&1; then
        echo -e " ${RED}ERROR:${NC} $main_net_node_ref ${RED}returned invalid timestamp for block:${NC} $2${NC}, test failed.${NC}"
        echo
        exit 1
    fi
}

# compare data from $caspermetrics_api with mainnet reference node, testing parameters: 'validators count, delegators count, switch block'
function validate_this_era() {

    # announcement
    echo -e " Test era set to: ${GREEN}$1${NC}" && echo
    echo -e " ${GREEN}Pulling era $1 data from platform API ...${NC}" && echo && Confirm

    # get era data from $caspermetrics_api
    curl -s "$caspermetrics_api"/era?id="$1" | jq .[] && echo

    # get test era start block
    test_era_start_block=$(curl -s "$caspermetrics_api"/era?id="$1" | jq -r '.[] | .startBlock')

    integer_check "$test_era_start_block" "test era start block"

    # get test era switch block from $caspermetrics_api
    test_era_switch_block=$(curl -s "$caspermetrics_api"/era?id="$1" | jq -r '.[] | .endBlock')

    integer_check "$test_era_switch_block" "test era switch block"

    echo -e " Era ${GREEN}$1${NC} start at block ${GREEN}$test_era_start_block${NC} end block ${GREEN}$test_era_switch_block${NC} ( aka switch )" && echo
    echo -e " ${YELLOW}Pulling data from reference mainnet RPC node ...${NC}" && echo && Confirm

    # use get-era-info-by-switch-block and store json object
    switch_block_json=$(casper-client get-era-info-by-switch-block --node-address "$main_net_node_ref" -b "$test_era_switch_block")

    validators_counter=$(echo "$switch_block_json" | jq '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Validator != null)) | length')
    delegators_counter=$(echo "$switch_block_json" | jq '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Delegator != null)) | length')

    integer_check "$validators_counter" "validators counter"
    integer_check "$delegators_counter" "delegators counter"

    # calculate delegators and validators, this will fail if block is not switch
    echo -e " Validators count: ${GREEN}$validators_counter${NC}"
    echo -e " Delegators count: ${GREEN}$delegators_counter${NC}"

    # calculate validators rewards
    total_validators_rewards_motes=$(echo "$switch_block_json" | jq -r '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Validator != null)) | .[].Validator.amount' | paste -s -d + - | bc -l)
    total_delegators_rewards_motes=$(echo "$switch_block_json" | jq -r '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Delegator != null)) | .[].Delegator.amount' | paste -s -d + - | bc -l)

    integer_check "$total_validators_rewards_motes" "total validators rewards in motes"
    integer_check "$total_delegators_rewards_motes" "total delegators rewards in motes"

    # convert motes to cspr
    cspr_validators_rewards=$(echo "$total_validators_rewards_motes / 1000000000" | bc -l)
    cspr_delegators_rewards=$(echo "$total_delegators_rewards_motes / 1000000000" | bc -l)

    era_reward_all=$(echo "($total_validators_rewards_motes + $total_delegators_rewards_motes) / 1000000000" | bc -l)

    # cut decimals for clarity
    echo -e " Calculated validators reward: ${GREEN}${cspr_validators_rewards%.*}${NC}"
    echo -e " Calculated delegators reward: ${GREEN}${cspr_delegators_rewards%.*}${NC}"
    echo -e " Total reward:                 ${GREEN}${era_reward_all%.*}${NC}" && echo

    echo -e " ${YELLOW}Looking for start block${NC} $test_era_start_block ${YELLOW}and switch block${NC} $test_era_switch_block ${YELLOW}timestamps of test era${NC} $1" && echo

    first_block_timestamp=$(casper-client get-block --node-address "$main_net_node_ref" -b "$test_era_start_block" | jq -r .result.block.header.timestamp)

    # timestamp validation
    validate_timestamp "$first_block_timestamp" "$test_era_start_block"

    last_block_timestamp=$(casper-client get-block --node-address "$main_net_node_ref" -b "$test_era_switch_block" | jq -r .result.block.header.timestamp)

    # timestamp validation
    validate_timestamp "$last_block_timestamp" "$test_era_switch_block"

    echo -e " Era start: ${GREEN}$first_block_timestamp${NC}"
    echo -e " Era end:   ${GREEN}$last_block_timestamp${NC}"
    echo

}

# wait for confirmation, only accept 'y', to cancel Ctrl+C
function Confirm() {

    echo -e " ${CYAN}Press 'y' to continue or Ctrl+C to cancel.${NC}"

    while true; do

        read -r -n 1 k <&1

        if [[ "$k" = y ]]; then
            echo -e "\r\033[K"
            break
        fi

    done

}

# filters validation, called from validate_filter_files function
function validate_filter() {

    # if present
    if ! [ -f "$1" ]; then

        echo
        echo " ERROR: Can't find $1, filters are separate files.json."
        echo
        exit 1

    fi

    # if empty
    if ! [ -s "$1" ]; then
        echo -e " ${RED}ERROR:${NC} $1 ${RED}is empty.${NC}" && echo
        exit 1
    fi

    # JSON format check
    if ! jq -e . >/dev/null 2>&1 <"$1"; then
        echo -e " ${RED}ERROR:${NC} $1 have invalid JSON format." && echo
        exit 1
    fi

}

# Filters are separate files which need to be present in the same folder with this script, filters are strict JSON formatted.
# for this test we will use example_1.json, example_2.json and example_3.json
function validate_filter_files() {

    validate_filter "example_1.json" && validate_filter "example_2.json" && validate_filter "example_3.json"

}

function example1() {

    # parse data from 'example_1.json' in case filter changed we still show correct values in message
    filter_gte=$(jq -r '.where.and | .[] | select(.startBlock.gte != null) | .startBlock.gte' <example_1.json)

    integer_check "$filter_gte" "Filter gte"

    filter_lte=$(jq -r '.where.and | .[] | select(.startBlock.lte != null) | .startBlock.lte' <example_1.json)

    integer_check "$filter_lte" "Filter lte"

    filter_limit=$(jq -r .limit <example_1.json)

    integer_check "$filter_limit" "Filter limit"

    # filters short description
    echo -e " ${YELLOW}Example_1.json${NC} search for ${GREEN}eras${NC} in range of blocks ${GREEN}$filter_gte${NC} - ${GREEN}$filter_lte${NC}, sort result by reward,"
    echo -e " then display eras data in rewards descending order with limit of ${GREEN}$filter_limit${NC}"
    echo -e " and display only selected fields: ${GREEN}id${NC} and ${GREEN}rewards${NC}" && echo

    # display filter content
    cat example_1.json && echo && Confirm

    # search eras in specified block range display accordingly to filter settings
    filter_output_json=$(curl -s --get --data-urlencode "filter=$(cat example_1.json)" "$caspermetrics_api"/era)

    # catch top 2 era data on the way for echo message
    era_arr_0=$(jq -r '.[0].id' <<<"$filter_output_json")
    era_arr_0_rewards=$(jq -r '.[0].rewards' <<<"$filter_output_json")

    integer_check "$era_arr_0" "Filtered era id" # check response

    era_arr_1=$(jq -r '.[1].id' <<<"$filter_output_json")
    era_arr_1_rewards=$(jq -r '.[1].rewards' <<<"$filter_output_json")

    integer_check "$era_arr_1" "Filtered era id" # check response

    # display collected content
    jq .[] <<<"$filter_output_json"

    # summarized message
    echo
    echo -e " - era ${YELLOW}$era_arr_0${NC} rewards: ${YELLOW}$era_arr_0_rewards${NC}"
    echo -e " - era ${YELLOW}$era_arr_1${NC} rewards: ${YELLOW}$era_arr_1_rewards${NC}" && echo

    # check top 2 eras for reward comparison
    validate_this_era "$era_arr_0"

    validate_this_era "$era_arr_1"

}

function example2() {

    # parse data from 'example_2.json' in case filter changed we still show correct output in a message below
    filter_gte=$(jq -r '.where.and | .[] | select(.id.gte != null) | .id.gte' <example_2.json)

    integer_check "$filter_gte" "Filter gte"

    filter_lte=$(jq -r '.where.and | .[] | select(.id.lte != null) | .id.lte' <example_2.json)

    integer_check "$filter_lte" "Filter lte"

    filter_limit=$(jq -r '.limit' <example_2.json)

    integer_check "$filter_limit" "Filter limit"

    # we going later trough switch blocks for extra validation from reference
    echo -e " ${YELLOW}Example_2.json${NC} search in ${GREEN}eras${NC} range ${GREEN}$filter_gte${NC} - ${GREEN}$filter_lte${NC}, sort result by ${GREEN}validatorsCount${NC} greater then ${GREEN}$filter_limit${NC},"
    echo -e " then provide us with eras data in validatorsCount ascending order trimmed by limit parameter,"
    echo -e " and display only selected fields: ${GREEN}id${NC}, ${GREEN}validatorsCount${NC} and end block aka ${GREEN}switch${NC}" && echo

    cat example_2.json && echo && Confirm

    filter_output_json=$(curl -s --get --data-urlencode "filter=$(cat example_2.json)" "$caspermetrics_api"/era)

    # display collected content
    jq .[] <<<"$filter_output_json" && echo

    # display data for comparison
    arr_lenght=$(echo $filter_output_json | jq 'length')

    for ((b = 0; b < "$arr_lenght"; ++b)); do

        era_id=$(jq -r '.['$b'] | .id' <<<$filter_output_json)

        integer_check "$era_id" "Era id"

        validators_count=$(jq -r '.['$b'] | .validatorsCount' <<<$filter_output_json)

        integer_check "$validators_count" "Validators count"

        switch_block=$(jq -r '.['$b'] | .endBlock' <<<$filter_output_json)

        integer_check "$switch_block" "Switch block"

        echo -e " - era ${GREEN}$era_id${NC} contain ${GREEN}$validators_count${NC} active validators ${CYAN}[${NC} switch: ${YELLOW}$switch_block ${CYAN}]${NC}"

    done

    echo

    echo -e ${YELLOW}" Comparing data with reference ...${NC}" && echo && Confirm

    # get data from reference
    # we will use switch blocks gathered from platform API, this will fail if this blocks are not switch
    for ((b = 0; b < "$arr_lenght"; ++b)); do

        # get switch block from platform API
        switch_block=$(jq -r '.['$b'] | .endBlock' <<<$filter_output_json)

        integer_check "$switch_block" "Switch block"

        switch_block_json=$(casper-client get-era-info-by-switch-block --node-address "$main_net_node_ref" -b "$switch_block")

        validators_counter=$(jq '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Validator != null)) | length' <<<"$switch_block_json")

        integer_check "$validators_counter" "Validators counter"

        reference_era_id_return=$(jq '.result.era_summary.era_id' <<<"$switch_block_json")

        integer_check "$reference_era_id_return" "Reference era id return"

        echo -e " - era ${GREEN}$reference_era_id_return${NC} contain ${GREEN}$validators_counter${NC} active validators ${CYAN}[${NC} switch check: ${GREEN}true ${CYAN}]${NC}"

    done

    echo

}

function example3() {

    # parse data from 'example_3.json' in case filter changed we still show correct output in a message below
    filter_gte=$(jq -r '.where.and | .[] | select(.blockHeight.gte != null) | .blockHeight.gte' <example_3.json)

    integer_check "$filter_gte"

    filter_lte=$(jq -r '.where.and | .[] | select(.blockHeight.lte != null) | .blockHeight.lte' <example_3.json)

    integer_check "$filter_lte"

    filter_limit=$(jq -r '.limit' <example_3.json)

    integer_check "$filter_limit"

    echo -e " ${YELLOW}Example_3.json${NC} will search in ${GREEN}blocks${NC} range ${GREEN}$filter_gte${NC} - ${GREEN}$filter_lte${NC},"
    echo -e " find only switch blocks and sort them in ascending order by height and return data trimmed by limit of ${GREEN}$filter_limit${NC}."
    echo -e " and display only selected fields: ${GREEN}blockHeight${NC} and ${GREEN}switch flag${NC}." && echo

    cat example_3.json && echo && Confirm

    filter_output_json=$(curl -s --get --data-urlencode "filter=$(cat example_3.json)" "$caspermetrics_api"/block)

    # display collected content
    jq .[] <<<"$filter_output_json" && echo && Confirm

    # calculate array lenght for loop
    arr_lenght=$(echo $filter_output_json | jq 'length')

    # run loop trough array and display data to simplify comparison
    for ((b = 0; b < "$arr_lenght"; ++b)); do

        blockHeight=$(jq -r '.['$b'] | .blockHeight' <<<$filter_output_json)

        integer_check "$blockHeight" "Block height"

        eraId=$(jq -r '.['$b'] | .eraId' <<<$filter_output_json)

        integer_check "$eraId" "Era Id"

        switch=$(jq -r '.['$b'] | .switch' <<<$filter_output_json)

        echo -e " - block ${GREEN}$blockHeight${NC} is member of era ${GREEN}$eraId${NC} ${CYAN}[${NC} switch: ${GREEN}$switch ${CYAN}]${NC}"

    done

    echo

    echo -e ${YELLOW}" Comparing data with reference ...${NC}" && echo && Confirm

    for ((b = 0; b < "$arr_lenght"; ++b)); do

        # we take switch from platform API, if not block is not switch, all below will fail.
        switch_block=$(jq -r '.['$b'] | .blockHeight' <<<$filter_output_json)

        integer_check "$switch_block" "Switch block"

        # collect reference data
        switch_block_json=$(casper-client get-era-info-by-switch-block --node-address "$main_net_node_ref" -b "$switch_block")

        # grab data for validation

        reference_era_id_return=$(jq '.result.era_summary.era_id' <<<"$switch_block_json")

        integer_check "$reference_era_id_return" "Reference era id return"

        validators_counter=$(jq '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Validator != null)) | length' <<<"$switch_block_json")

        integer_check "$validators_counter" "Validators counter"

        delegators_counter=$(echo "$switch_block_json" | jq '.result.era_summary.stored_value.EraInfo.seigniorage_allocations | map(select(.Delegator != null)) | length')

        integer_check "$delegators_counter" "Delegators counter"

        echo -e " - block ${GREEN}$switch_block${NC} is member of era ${GREEN}$reference_era_id_return${NC} validators: ${GREEN}$validators_counter${NC} delegators: ${GREEN}$delegators_counter${NC} ${CYAN}[${NC} switch check: ${GREEN}pass ${CYAN}]${NC}"

    done

    echo

}

check_requirements # check if required packages are installed, if not installed test will fail
test_endpoints     # test if endpoints set in config and are all in sync. Test will fail if not all conditions meet the reqariment

validate_this_era "$test_era"  && Confirm # send testing era in to era processor function

echo -e " Testing complex filters, they are stored in ${YELLOW}example_x.json${NC} files which need to be present in the same folder with script."
echo

Confirm

validate_filter_files

# run trough filter examples
example1 && Confirm
example2 && Confirm
example3

echo -e " ${GREEN}-------------------------------------------------------${NC}"
echo -e " ${GREEN}ALL COMPARISON AND FUNCTIONAL TESTS PASSED WITH SUCCESS${NC}"
echo -e " ${GREEN}-------------------------------------------------------${NC}" && echo

echo -e " ${CYAN}Additional documentation on querying data:${NC} https://loopback.io/doc/en/lb4/Querying-data.html "
echo -e " ${CYAN}Platform documentation:${NC} https://github.com/a3mc/Casper-Metrics/tree/master/docs" && echo
