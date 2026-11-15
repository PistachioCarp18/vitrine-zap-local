(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineQrCode = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Gerador de QR Code SVG 100% offline (zero API externa, zero CDN)
   * Suporta Byte Mode, ECC-L, versoes 1 a 14 (ate ~450 bytes — suficiente para qualquer Pix BR Code).
   */
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];

  function gfMul(a, b) {
    return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGeneratorPoly(ecLen) {
    let poly = [1];
    for (let i = 0; i < ecLen; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    const gen = rsGeneratorPoly(ecLen);
    const res = new Array(data.length + ecLen).fill(0);
    for (let i = 0; i < data.length; i++) res[i] = data[i];
    for (let i = 0; i < data.length; i++) {
      const factor = res[i];
      if (factor !== 0) {
        for (let j = 0; j < gen.length; j++) {
          res[i + j] ^= gfMul(gen[j], factor);
        }
      }
    }
    return res.slice(data.length);
  }

  // Capacidades ECC-L (bytes maximos em Byte mode para v1..v14, 1 bloco ou multiplos)
  // [version, totalCodewords, ecPerBlock, blocksG1, dataPerBlockG1, blocksG2, dataPerBlockG2, alignCoords]
  const VERSIONS = [
    null,
    [1, 26, 7, 1, 19, 0, 0, []],
    [2, 44, 10, 1, 34, 0, 0, [6, 18]],
    [3, 70, 15, 1, 55, 0, 0, [6, 22]],
    [4, 100, 20, 1, 80, 0, 0, [6, 26]],
    [5, 134, 26, 1, 108, 0, 0, [6, 30]],
    [6, 172, 18, 2, 68, 0, 0, [6, 34]],
    [7, 196, 20, 2, 78, 0, 0, [6, 22, 38]],
    [8, 242, 24, 2, 97, 0, 0, [6, 24, 42]],
    [9, 292, 30, 2, 116, 0, 0, [6, 26, 46]],
    [10, 346, 18, 2, 68, 2, 69, [6, 28, 50]],
    [11, 404, 20, 4, 81, 0, 0, [6, 30, 54]],
    [12, 466, 24, 2, 92, 2, 93, [6, 32, 58]],
    [13, 532, 26, 4, 107, 0, 0, [6, 34, 62]],
    [14, 581, 30, 3, 115, 1, 116, [6, 26, 46, 66]],
  ];

  function createMatrix(text) {
    const bytes = Array.from(new TextEncoder().encode(String(text || '')));
    let verSpec = null;
    for (let v = 1; v < VERSIONS.length; v++) {
      const s = VERSIONS[v];
      const cap = s[3] * s[4] + s[5] * s[6];
      const headerBytes = v >= 10 ? 3 : 2;
      if (bytes.length + headerBytes <= cap) {
        verSpec = s;
        break;
      }
    }
    if (!verSpec) throw new Error('Texto excede capacidade do QR Code offline.');

    const [ver, , ecPerBlock, b1, d1, b2, d2, alignCoords] = verSpec;
    const totalData = b1 * d1 + b2 * d2;

    // Bit stream (Byte mode 0100)
    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };
    pushBits(0b0100, 4);
    pushBits(bytes.length, ver >= 10 ? 16 : 8);
    bytes.forEach(b => pushBits(b, 8));
    pushBits(0, Math.min(4, totalData * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const dataBytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let val = 0;
      for (let j = 0; j < 8; j++) val = (val << 1) | bits[i + j];
      dataBytes.push(val);
    }
    const padBytes = [0xec, 0x11];
    for (let i = 0; dataBytes.length < totalData; i++) dataBytes.push(padBytes[i % 2]);

    // Split blocks + RS ECC
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let i = 0; i < b1; i++) {
      const blk = dataBytes.slice(offset, offset + d1);
      offset += d1;
      dataBlocks.push(blk);
      ecBlocks.push(rsEncode(blk, ecPerBlock));
    }
    for (let i = 0; i < b2; i++) {
      const blk = dataBytes.slice(offset, offset + d2);
      offset += d2;
      dataBlocks.push(blk);
      ecBlocks.push(rsEncode(blk, ecPerBlock));
    }

    const codewords = [];
    const maxDataLen = Math.max(d1, d2);
    for (let i = 0; i < maxDataLen; i++) {
      for (const blk of dataBlocks) if (i < blk.length) codewords.push(blk[i]);
    }
    for (let i = 0; i < ecPerBlock; i++) {
      for (const ec of ecBlocks) codewords.push(ec[i]);
    }

    const size = ver * 4 + 17;
    const mat = Array.from({ length: size }, () => new Array(size).fill(null));
    const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));

    const setFunc = (r, c, v) => {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        mat[r][c] = v ? 1 : 0;
        isFunc[r][c] = true;
      }
    };

    const drawFinder = (top, left) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          const dark = inOuter && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          setFunc(top + r, left + c, dark);
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    // Alignment patterns
    for (const r of alignCoords) {
      for (const c of alignCoords) {
        if (isFunc[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setFunc(r + dr, c + dc, dark);
          }
        }
      }
    }

    // Dark module & reserve format info
    setFunc(size - 8, 8, true);
    for (let i = 0; i < 9; i++) {
      if (!isFunc[8][i]) setFunc(8, i, false);
      if (!isFunc[i][8]) setFunc(i, 8, false);
    }
    for (let i = 0; i < 8; i++) {
      if (!isFunc[8][size - 1 - i]) setFunc(8, size - 1 - i, false);
      if (!isFunc[size - 1 - i][8]) setFunc(size - 1 - i, 8, false);
    }
    if (ver >= 7) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          setFunc(i, size - 11 + j, false);
          setFunc(size - 11 + j, i, false);
        }
      }
    }

    // Place data bits (mask 0: (r + c) % 2 === 0)
    const bitStream = [];
    for (const cw of codewords) {
      for (let b = 7; b >= 0; b--) bitStream.push((cw >> b) & 1);
    }
    let bitIdx = 0;
    let up = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let step = 0; step < size; step++) {
        const r = up ? size - 1 - step : step;
        for (let cOffset = 0; cOffset < 2; cOffset++) {
          const c = right - cOffset;
          if (!isFunc[r][c]) {
            const bit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
            const masked = ((r + c) % 2 === 0) ? (bit ^ 1) : bit;
            mat[r][c] = masked;
          }
        }
      }
      up = !up;
    }

    // Format info for ECC-L (01) + Mask 0 (000) -> 01000 -> BCH(15,5) ^ 0x5412 = 0x77C4
    const fmt = 0x77C4;
    for (let i = 0; i < 15; i++) {
      const bit = (fmt >> i) & 1;
      if (i < 6) mat[i][8] = bit;
      else if (i < 8) mat[i + 1][8] = bit;
      else mat[size - 15 + i][8] = bit;

      if (i < 8) mat[8][size - 1 - i] = bit;
      else if (i < 9) mat[8][15 - i] = bit;
      else mat[8][14 - i] = bit;
    }

    return mat;
  }

  function renderQrSvg(text, pixelSize = 180) {
    const mat = createMatrix(text);
    const n = mat.length;
    const quiet = 2;
    const total = n + quiet * 2;
    let paths = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (mat[r][c]) {
          paths += `M${c + quiet},${r + quiet}h1v1h-1z`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${pixelSize}" height="${pixelSize}" role="img" aria-label="QR Code Pix"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="${paths}" fill="#0F172A"/></svg>`;
  }

  return { createMatrix, renderQrSvg };
}));
