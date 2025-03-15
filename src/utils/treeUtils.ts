// treeUtils.ts
export const parseTreeId = (id: string) => {
  const locationCode = id.slice(0, 2); // KR
  const treeType = id.charAt(2); // A
  const subtype = id.charAt(3); // M
  const number = id.slice(4); // 001

  return {
    locationCode,
    treeType,
    subtype,
    number,
  };
};

export const getTreeDetails = (id: string) => {
  const parsed = parseTreeId(id);
  const locations: { [key: string]: string } = {
    KR: "Karangasem",
  };
  const types: { [key: string]: string } = {
    A: "Alpukat",
  };
  const subtypes: { [key: string]: string } = {
    M: "Manalagi",
  };

  return {
    location: locations[parsed.locationCode] || "Unknown",
    type: types[parsed.treeType] || "Unknown",
    subtype: subtypes[parsed.subtype] || "Unknown",
    number: parsed.number,
  };
};
