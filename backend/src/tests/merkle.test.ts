import { MerkleTreeBuilder } from '../utils/merkle';

describe('MerkleTreeBuilder', () => {
  const sampleSegments = [
    {
      startTime: new Date('2025-01-01T08:00:00Z'),
      endTime: new Date('2025-01-01T08:30:00Z'),
      distance: 15.5,
      rawDataCID: 'QmTest1'
    },
    {
      startTime: new Date('2025-01-01T09:00:00Z'),
      endTime: new Date('2025-01-01T09:45:00Z'),
      distance: 25.2,
      rawDataCID: 'QmTest2'
    },
    {
      startTime: new Date('2025-01-01T10:30:00Z'),
      endTime: new Date('2025-01-01T11:00:00Z'),
      distance: 12.8,
      rawDataCID: 'QmTest3'
    }
  ];

  describe('buildTree', () => {
    it('should build a valid Merkle tree from segments', () => {
      const tree = MerkleTreeBuilder.buildTree(sampleSegments);
      
      expect(tree).toBeDefined();
      expect(tree.root).toBeDefined();
      expect(tree.leaves).toHaveLength(3);
      expect(tree.depth).toBeGreaterThan(0);
      expect(tree.root.hash).toBeDefined();
    });

    it('should produce deterministic root for same segments', () => {
      const tree1 = MerkleTreeBuilder.buildTree(sampleSegments);
      const tree2 = MerkleTreeBuilder.buildTree(sampleSegments);
      
      expect(tree1.root.hash).toBe(tree2.root.hash);
    });

    it('should produce different roots for different segments', () => {
      const modifiedSegments = [...sampleSegments];
      modifiedSegments[0].distance = 20.0; // Change distance
      
      const tree1 = MerkleTreeBuilder.buildTree(sampleSegments);
      const tree2 = MerkleTreeBuilder.buildTree(modifiedSegments);
      
      expect(tree1.root.hash).not.toBe(tree2.root.hash);
    });

    it('should handle single segment', () => {
      const singleSegment = [sampleSegments[0]];
      const tree = MerkleTreeBuilder.buildTree(singleSegment);
      
      expect(tree.leaves).toHaveLength(1);
      expect(tree.depth).toBe(1);
      expect(tree.root).toBe(tree.leaves[0]);
    });

    it('should throw error for empty segments', () => {
      expect(() => {
        MerkleTreeBuilder.buildTree([]);
      }).toThrow('Cannot build Merkle tree from empty segments');
    });
  });

  describe('verifySegment', () => {
    it('should verify valid segment with correct proof', () => {
      const tree = MerkleTreeBuilder.buildTree(sampleSegments);
      const segmentIndex = 1;
      const proof = MerkleTreeBuilder.generateProof(tree, segmentIndex);
      const segment = sampleSegments[segmentIndex];
      
      const isValid = MerkleTreeBuilder.verifySegment(segment, tree.root.hash, proof);
      expect(isValid).toBe(true);
    });

    it('should reject invalid segment', () => {
      const tree = MerkleTreeBuilder.buildTree(sampleSegments);
      const segmentIndex = 1;
      const proof = MerkleTreeBuilder.generateProof(tree, segmentIndex);
      const invalidSegment = { ...sampleSegments[segmentIndex], distance: 999 }; // Wrong distance
      
      const isValid = MerkleTreeBuilder.verifySegment(invalidSegment, tree.root.hash, proof);
      expect(isValid).toBe(false);
    });

    it('should reject segment with wrong proof', () => {
      const tree = MerkleTreeBuilder.buildTree(sampleSegments);
      const segment = sampleSegments[0];
      const wrongProof = ['wrong', 'proof', 'hashes'];
      
      const isValid = MerkleTreeBuilder.verifySegment(segment, tree.root.hash, wrongProof);
      expect(isValid).toBe(false);
    });
  });

  describe('generateProof', () => {
    it('should generate valid proof for any segment', () => {
      const tree = MerkleTreeBuilder.buildTree(sampleSegments);
      
      for (let i = 0; i < sampleSegments.length; i++) {
        const proof = MerkleTreeBuilder.generateProof(tree, i);
        expect(proof).toBeDefined();
        expect(Array.isArray(proof)).toBe(true);
      }
    });

    it('should throw error for invalid segment index', () => {
      const tree = MerkleTreeBuilder.buildTree(sampleSegments);
      
      expect(() => {
        MerkleTreeBuilder.generateProof(tree, 999);
      }).toThrow('Segment index out of bounds');
    });
  });

  describe('getTreeStats', () => {
    it('should return correct tree statistics', () => {
      const tree = MerkleTreeBuilder.buildTree(sampleSegments);
      const stats = MerkleTreeBuilder.getTreeStats(tree);
      
      expect(stats.leafCount).toBe(3);
      expect(stats.depth).toBeGreaterThan(0);
      expect(stats.rootHash).toBe(tree.root.hash);
      expect(stats.totalNodes).toBeGreaterThan(0);
    });
  });
});
