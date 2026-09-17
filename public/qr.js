/**
 * Minimal, zero-dependency QR Code generator in vanilla JavaScript.
 * Generates clean SVG markup for any URL or text.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QRCode = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Galois Field GF(256) math tables
  const EXP_TABLE = new Uint8Array(256);
  const LOG_TABLE = new Uint8Array(256);
  for (let i = 0, x = 1; i < 256; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }

  function gfMul(x, y) {
    if (x === 0 || y === 0) return 0;
    return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
  }

  // Error Correction Polynomial generator
  function makeGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= gfMul(poly[j], EXP_TABLE[i]);
        next[j + 1] ^= poly[j];
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, numEcc) {
    const gen = makeGeneratorPoly(numEcc);
    const res = new Uint8Array(numEcc);
    for (const b of data) {
      const factor = b ^ res[0];
      for (let i = 0; i < numEcc - 1; i++) {
        res[i] = res[i + 1] ^ gfMul(factor, gen[i + 1]);
      }
      res[numEcc - 1] = gfMul(factor, gen[numEcc]);
    }
    return res;
  }

  // Version table definitions (Capacity, EC codewords, Block info)
  // We include versions 1 to 8 (supports up to ~192 characters, plenty for short URLs)
  const VERSIONS = [
    null,
    // v1: 21x21, capacity 17 bytes, 7 EC bytes
    { version: 1, size: 21, totalBytes: 26, dataBytes: 19, ecBytes: 7, blocks: 1 },
    // v2: 25x25, capacity 32 bytes, 10 EC bytes
    { version: 2, size: 25, totalBytes: 44, dataBytes: 34, ecBytes: 10, blocks: 1 },
    // v3: 29x29, capacity 53 bytes, 15 EC bytes
    { version: 3, size: 29, totalBytes: 70, dataBytes: 55, ecBytes: 15, blocks: 1 },
    // v4: 33x33, capacity 78 bytes, 20 EC bytes
    { version: 4, size: 33, totalBytes: 100, dataBytes: 80, ecBytes: 20, blocks: 1 },
    // v5: 37x37, capacity 106 bytes, 26 EC bytes
    { version: 5, size: 37, totalBytes: 134, dataBytes: 108, ecBytes: 26, blocks: 1 },
    // v6: 41x41, capacity 134 bytes, 18 EC bytes, 2 blocks
    { version: 6, size: 41, totalBytes: 172, dataBytes: 136, ecBytes: 18, blocks: 2 },
    // v7: 45x45, capacity 154 bytes, 20 EC bytes, 2 blocks
    { version: 7, size: 45, totalBytes: 196, dataBytes: 156, ecBytes: 20, blocks: 2 },
    // v8: 49x49, capacity 192 bytes, 24 EC bytes, 2 blocks
    { version: 8, size: 49, totalBytes: 242, dataBytes: 194, ecBytes: 24, blocks: 2 },
  ];

  function getAlignmentPatternPositions(version) {
    if (version === 1) return [];
    if (version === 2) return [6, 18];
    if (version === 3) return [6, 22];
    if (version === 4) return [6, 26];
    if (version === 5) return [6, 30];
    if (version === 6) return [6, 34];
    if (version === 7) return [6, 22, 38];
    if (version === 8) return [6, 24, 42];
    return [];
  }

  function encodeData(text) {
    const utf8 = new TextEncoder().encode(text);
    let chosenVersion = null;

    for (let v = 1; v < VERSIONS.length; v++) {
      const vInfo = VERSIONS[v];
      // Byte mode header: 4 bits mode (0100) + 8 bits length + data
      const capacity = vInfo.dataBytes;
      if (utf8.length + 2 <= capacity) {
        chosenVersion = vInfo;
        break;
      }
    }

    if (!chosenVersion) {
      // Fallback to version 8 if slightly longer
      chosenVersion = VERSIONS[8];
    }

    // Bitstream builder
    const bits = [];
    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) {
        bits.push((val >> i) & 1);
      }
    }

    // 0100 = 8-bit byte mode
    pushBits(0b0100, 4);
    // Character count indicator (8 bits for v1-9 byte mode)
    pushBits(utf8.length, 8);
    // Data bytes
    for (let i = 0; i < utf8.length; i++) {
      pushBits(utf8[i], 8);
    }

    // Terminator (up to 4 zeroes)
    const dataBitCapacity = chosenVersion.dataBytes * 8;
    for (let i = 0; i < 4 && bits.length < dataBitCapacity; i++) {
      bits.push(0);
    }

    // Byte align
    while (bits.length % 8 !== 0) {
      bits.push(0);
    }

    // Convert to bytes
    const dataBytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | bits[i + j];
      }
      dataBytes.push(b);
    }

    // Pad bytes 0xEC, 0x11
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (dataBytes.length < chosenVersion.dataBytes) {
      dataBytes.push(padBytes[padIdx % 2]);
      padIdx++;
    }

    // Error Correction Codewords computation
    const totalData = chosenVersion.dataBytes;
    const ecPerBlock = chosenVersion.ecBytes;
    const numBlocks = chosenVersion.blocks;
    const dataPerBlock = Math.floor(totalData / numBlocks);

    const blocksData = [];
    const blocksEc = [];

    for (let b = 0; b < numBlocks; b++) {
      const start = b * dataPerBlock;
      const end = (b === numBlocks - 1) ? totalData : start + dataPerBlock;
      const blockSlice = dataBytes.slice(start, end);
      blocksData.push(blockSlice);
      blocksEc.push(rsEncode(blockSlice, ecPerBlock));
    }

    // Interleave data
    const finalCodewords = [];
    for (let i = 0; i < dataPerBlock + (totalData % numBlocks > 0 ? 1 : 0); i++) {
      for (let b = 0; b < numBlocks; b++) {
        if (i < blocksData[b].length) {
          finalCodewords.push(blocksData[b][i]);
        }
      }
    }
    // Interleave EC
    for (let i = 0; i < ecPerBlock; i++) {
      for (let b = 0; b < numBlocks; b++) {
        finalCodewords.push(blocksEc[b][i]);
      }
    }

    return { version: chosenVersion.version, size: chosenVersion.size, codewords: finalCodewords };
  }

  function createMatrix(size) {
    const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
    const isReserved = Array.from({ length: size }, () => new Array(size).fill(false));

    function setModule(r, c, val) {
      matrix[r][c] = val ? 1 : 0;
      isReserved[r][c] = true;
    }

    // 1. Finder patterns (7x7 at corners)
    function addFinder(row, col) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const nr = row + r;
          const nc = col + c;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const isBorder = (r === 0 || r === 6 || c === 0 || c === 6);
            const isCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            setModule(nr, nc, isBorder || isCenter);
          }
        }
      }
    }

    addFinder(0, 0);
    addFinder(0, size - 7);
    addFinder(size - 7, 0);

    // 2. Timing patterns
    for (let i = 8; i < size - 8; i++) {
      if (matrix[6][i] === null) setModule(6, i, i % 2 === 0);
      if (matrix[i][6] === null) setModule(i, 6, i % 2 === 0);
    }

    // 3. Alignment patterns
    const alignCoords = getAlignmentPatternPositions(Math.floor((size - 17) / 4));
    for (let i = 0; i < alignCoords.length; i++) {
      for (let j = 0; j < alignCoords.length; j++) {
        const ar = alignCoords[i];
        const ac = alignCoords[j];
        if (isReserved[ar][ac]) continue;

        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isCenter = r === 0 && c === 0;
            setModule(ar + r, ac + c, isEdge || isCenter);
          }
        }
      }
    }

    // 4. Dark module
    setModule(size - 8, 8, true);

    // 5. Reserve format information areas
    for (let i = 0; i < 9; i++) {
      if (!isReserved[8][i]) isReserved[8][i] = true;
      if (!isReserved[i][8]) isReserved[i][8] = true;
    }
    for (let i = size - 8; i < size; i++) {
      if (!isReserved[8][i]) isReserved[8][i] = true;
      if (!isReserved[i][8]) isReserved[i][8] = true;
    }

    return { matrix, isReserved, size };
  }

  // Format info string for Error Correction L (01) + Mask pattern 0 (000) = 01000 => 0x77c4 with BCH
  // For EC Level L, mask 0: 0x77c4 (111011111000100)
  const FORMAT_INFO_L_MASK0 = 0x77c4;

  function placeDataAndMask(grid, codewords) {
    const { matrix, isReserved, size } = grid;
    const bits = [];
    for (const byte of codewords) {
      for (let i = 7; i >= 0; i--) {
        bits.push((byte >> i) & 1);
      }
    }

    let bitIdx = 0;
    let right = size - 1;

    while (right > 0) {
      if (right === 6) right--; // Skip vertical timing column

      for (let vert = 0; vert < size; vert++) {
        for (let colOffset = 0; colOffset < 2; colOffset++) {
          const col = right - colOffset;
          // zigzag direction
          const row = ((right + 1) / 2) % 2 === 0 ? size - 1 - vert : vert;

          if (!isReserved[row][col]) {
            let bit = bitIdx < bits.length ? bits[bitIdx++] : 0;
            // Mask pattern 0: (row + col) % 2 == 0
            if ((row + col) % 2 === 0) {
              bit ^= 1;
            }
            matrix[row][col] = bit;
          }
        }
      }
      right -= 2;
    }

    // Place format info bits
    for (let i = 0; i < 15; i++) {
      const bit = (FORMAT_INFO_L_MASK0 >> i) & 1;
      // Top-left
      if (i < 6) matrix[8][i] = bit;
      else if (i < 8) matrix[8][i + 1] = bit;
      else if (i === 8) matrix[7][8] = bit;
      else matrix[14 - i][8] = bit;

      // Split copy
      if (i < 8) matrix[size - 1 - i][8] = bit;
      else matrix[8][size - 15 + i] = bit;
    }
  }

  function generateSVG(text, options = {}) {
    const encoded = encodeData(text);
    const grid = createMatrix(encoded.size);
    placeDataAndMask(grid, encoded.codewords);

    const size = grid.size;
    const matrix = grid.matrix;

    const margin = options.margin !== undefined ? options.margin : 2;
    const darkColor = options.darkColor || '#0f172a';
    const lightColor = options.lightColor || '#ffffff';
    const svgSize = options.size || 220;

    const totalDimension = size + margin * 2;
    let paths = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === 1) {
          const x = c + margin;
          const y = r + margin;
          paths += `M${x},${y}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDimension} ${totalDimension}" width="${svgSize}" height="${svgSize}" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="${lightColor}" rx="8"/>
      <path d="${paths.trim()}" fill="${darkColor}"/>
    </svg>`;
  }

  return {
    toSVG: generateSVG
  };
});
