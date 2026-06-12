export const SOCIETY_BLOCKS = [
  { name: "Jade", code: "J" },
  { name: "Topaz", code: "T" },
  { name: "Nest", code: "N" },
  { name: "Opal", code: "O" },
] as const;

export type SocietyBlock = (typeof SOCIETY_BLOCKS)[number]["name"];

export const floorMap: Record<string, string> = {
  A: "1",
  B: "2",
  C: "3",
  D: "4",
};

export const floorLabelMap: Record<string, string> = {
  A: "1st floor",
  B: "2nd floor",
  C: "3rd floor",
  D: "4th floor",
};

export function normalizeFlatId(flat = "") {
  return flat.trim().toUpperCase().replace(/[\s-]+/g, "");
}

export function getBlockNameFromCode(code = "") {
  const normalized = code.trim().toUpperCase();
  return SOCIETY_BLOCKS.find((block) => block.code === normalized)?.name || "";
}

export function parseFlatId(flat = "") {
  const normalized = normalizeFlatId(flat);
  const match = normalized.match(/^([JTNO])?(\d+)([A-D])$/);

  if (!match) {
    return {
      normalized,
      block: "",
      blockCode: "",
      tower: "",
      flatLetter: "",
      floor: "",
      floorLabel: "",
      isValid: false,
    };
  }

  const [, blockCode = "", tower, flatLetter] = match;

  return {
    normalized,
    block: getBlockNameFromCode(blockCode),
    blockCode,
    tower,
    flatLetter,
    floor: floorMap[flatLetter] || "",
    floorLabel: floorLabelMap[flatLetter] || "",
    isValid: true,
  };
}

export function compactFlatExample() {
  return "N22A";
}
