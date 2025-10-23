import crypto from 'crypto';
import { logger } from './logger';

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: any;
}

export interface MerkleTree {
  root: MerkleNode;
  leaves: MerkleNode[];
  depth: number;
}

/**
 * Merkle Tree Builder for Telemetry Data Integrity
 * Builds deterministic Merkle trees from telemetry segments
 */
export class MerkleTreeBuilder {
  
  /**
   * Build Merkle tree from telemetry segments
   */
  static buildTree(segments: Array<{
    startTime: Date;
    endTime: Date;
    distance: number;
    rawDataCID?: string;
  }>): MerkleTree {
    if (segments.length === 0) {
      throw new Error('Cannot build Merkle tree from empty segments');
    }

    // Create leaf nodes from segments
    const leaves = segments.map((segment, index) => {
      const leafData = {
        index,
        startTime: segment.startTime.toISOString(),
        endTime: segment.endTime.toISOString(),
        distance: segment.distance,
        rawDataCID: segment.rawDataCID || null
      };
      
      const hash = this.hashSegment(leafData);
      return {
        hash,
        data: leafData
      };
    });

    // Build tree bottom-up
    const tree = this.buildTreeFromLeaves(leaves);
    
    logger.info(`🌳 Built Merkle tree with ${leaves.length} leaves, depth: ${tree.depth}`);
    
    return tree;
  }

  /**
   * Hash a single segment for Merkle tree
   */
  private static hashSegment(segmentData: any): string {
    const dataString = JSON.stringify(segmentData, Object.keys(segmentData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Build tree from leaf nodes
   */
  private static buildTreeFromLeaves(leaves: MerkleNode[]): MerkleTree {
    if (leaves.length === 1) {
      return {
        root: leaves[0],
        leaves,
        depth: 1
      };
    }

    let currentLevel = [...leaves];
    let depth = 0;

    while (currentLevel.length > 1) {
      const nextLevel: MerkleNode[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate last node if odd number
        
        const combinedHash = this.hashNodes(left.hash, right.hash);
        const parent: MerkleNode = {
          hash: combinedHash,
          left,
          right
        };
        
        nextLevel.push(parent);
      }
      
      currentLevel = nextLevel;
      depth++;
    }

    return {
      root: currentLevel[0],
      leaves,
      depth
    };
  }

  /**
   * Hash two node hashes together
   */
  private static hashNodes(leftHash: string, rightHash: string): string {
    // Sort hashes to ensure deterministic ordering
    const combined = leftHash < rightHash ? leftHash + rightHash : rightHash + leftHash;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Verify a segment against Merkle tree
   */
  static verifySegment(
    segment: any,
    merkleRoot: string,
    proof: string[]
  ): boolean {
    try {
      const segmentHash = this.hashSegment(segment);
      let currentHash = segmentHash;
      
      for (const proofHash of proof) {
        currentHash = this.hashNodes(currentHash, proofHash);
      }
      
      return currentHash === merkleRoot;
    } catch (error) {
      logger.error('❌ Merkle verification failed:', error);
      return false;
    }
  }

  /**
   * Generate Merkle proof for a segment
   */
  static generateProof(tree: MerkleTree, segmentIndex: number): string[] {
    if (segmentIndex >= tree.leaves.length) {
      throw new Error('Segment index out of bounds');
    }

    const proof: string[] = [];
    let currentIndex = segmentIndex;
    let currentLevel = tree.leaves;
    let levelIndex = 0;

    while (currentLevel.length > 1) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      
      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex].hash);
      }
      
      // Move to parent level
      currentIndex = Math.floor(currentIndex / 2);
      levelIndex++;
      
      // Rebuild current level (simplified - in production, cache intermediate levels)
      currentLevel = this.buildNextLevel(currentLevel);
    }

    return proof;
  }

  /**
   * Build next level of tree (helper for proof generation)
   */
  private static buildNextLevel(level: MerkleNode[]): MerkleNode[] {
    const nextLevel: MerkleNode[] = [];
    
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      
      const combinedHash = this.hashNodes(left.hash, right.hash);
      nextLevel.push({
        hash: combinedHash,
        left,
        right
      });
    }
    
    return nextLevel;
  }

  /**
   * Get tree statistics
   */
  static getTreeStats(tree: MerkleTree): {
    leafCount: number;
    depth: number;
    rootHash: string;
    totalNodes: number;
  } {
    const totalNodes = Math.pow(2, tree.depth + 1) - 1;
    
    return {
      leafCount: tree.leaves.length,
      depth: tree.depth,
      rootHash: tree.root.hash,
      totalNodes
    };
  }
}
