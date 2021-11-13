import { CasperServiceByJsonRPC } from 'casper-client-sdk';
import { BlockRepository, EraRepository, KnownAccountRepository, TransferRepository } from '../repositories';
import { RedisService } from './redis.service';
import { CirculatingService } from "./circulating.service";
export interface CasperServiceSet {
    lastBlock?: number;
    node: CasperServiceByJsonRPC;
    ip: string;
}
export declare class CrawlerService {
    eraRepository: EraRepository;
    blocksRepository: BlockRepository;
    transferRepository: TransferRepository;
    knownAccountRepository: KnownAccountRepository;
    redisService: RedisService;
    circulatingService: CirculatingService;
    private _casperServices;
    private _minRpcNodes;
    constructor(eraRepository: EraRepository, blocksRepository: BlockRepository, transferRepository: TransferRepository, knownAccountRepository: KnownAccountRepository, redisService: RedisService, circulatingService: CirculatingService);
    getLastBlockHeight(): Promise<number>;
    createBlock(blockHeight: number): Promise<void>;
    calcBlocksAndEras(): Promise<void>;
    private _casperService;
    private _getRandomNodeIP;
    private _getLastBlockWithTimeout;
    private _createNewEra;
    private _updateCompletedEra;
    private _createGenesisEra;
    private _getTotalSupply;
    private _getValidatorsWeights;
    private _processTransfers;
    private _processDeploys;
    private _nominate;
    private _denominate;
}
