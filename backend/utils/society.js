const BLOCKS = [
  { name: "Jade", code: "J" },
  { name: "Topaz", code: "T" },
  { name: "Nest", code: "N" },
  { name: "Opal", code: "O" },
];

const blockMap = BLOCKS.reduce((map, block) => {
  map[block.name] = block.code;
  map[block.name.toUpperCase()] = block.code;
  map[block.code] = block.code;
  return map;
}, {});

const normalizeBlockCode = (block = "") => {
  const raw = block.toString().trim();
  if (!raw) return "";

  return blockMap[raw] || blockMap[raw.toUpperCase()] || raw.charAt(0).toUpperCase();
};

const normalizeFlat = (flat = "") =>
  flat.toString().trim().toUpperCase().replace(/[\s-]+/g, "");

const getFlatParts = (flat = "") => {
  const normalizedFlat = normalizeFlat(flat);
  const firstChar = normalizedFlat.charAt(0);
  const hasBlockPrefix =
    Boolean(blockMap[firstChar]) && /\d/.test(normalizedFlat.charAt(1));
  const blockCode = hasBlockPrefix ? firstChar : "";
  const flatWithoutBlock = hasBlockPrefix ? normalizedFlat.slice(1) : normalizedFlat;
  const tower = flatWithoutBlock.match(/^\d+/)?.[0] || "";

  return {
    normalizedFlat,
    blockCode,
    flatWithoutBlock,
    tower,
  };
};

const canonicalFlat = (flat = "", block = "") => {
  const normalizedFlat = normalizeFlat(flat);
  if (!normalizedFlat) return "";

  const parts = getFlatParts(normalizedFlat);
  if (parts.blockCode) return normalizedFlat;

  const blockCode = normalizeBlockCode(block);
  return blockCode ? `${blockCode}${normalizedFlat}` : normalizedFlat;
};

const flatAliases = (flat = "", block = "") => {
  const canonical = canonicalFlat(flat, block);
  const { blockCode, flatWithoutBlock } = getFlatParts(canonical || flat);
  const aliases = new Set([normalizeFlat(flat), canonical, flatWithoutBlock]);

  if (blockCode && flatWithoutBlock) {
    aliases.add(`${blockCode}${flatWithoutBlock}`);
    aliases.add(`${blockCode}-${flatWithoutBlock}`);
  }

  return Array.from(aliases).filter(Boolean);
};

const floorFromFlat = (flat = "") => {
  const { flatWithoutBlock } = getFlatParts(flat);
  const flatLetter = flatWithoutBlock.match(/[A-Z]$/)?.[0];
  const floorMap = {
    A: "1",
    B: "2",
    C: "3",
    D: "4",
  };

  return floorMap[flatLetter] || "";
};

module.exports = {
  BLOCKS,
  blockMap,
  canonicalFlat,
  flatAliases,
  floorFromFlat,
  getFlatParts,
  normalizeBlockCode,
  normalizeFlat,
};
