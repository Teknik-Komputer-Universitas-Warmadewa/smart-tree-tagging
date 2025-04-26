// treeUtils.ts

export const parseTreeId = (id: string) => {
  const locationCode = id.slice(0, 2); // e.g., "KR" (2 characters)
  const farmType = id.slice(2, 4); // e.g., "AP" (2 characters)
  const subtype = id.charAt(4); // e.g., "M" (1 character)
  const number = id.slice(5); // e.g., "0001" (remaining 4 characters)

  return {
    locationCode,
    farmType,
    subtype,
    number,
  };
};

export const getTreeDetails = (id: string) => {
  const parsed = parseTreeId(id);
  const locations: { [key: string]: string } = {
    KR: "Karangasem",
    BA: "Bangli",
    BU: "Buleleng",
    GI: "Gianyar",
    JE: "Jembrana",
    KL: "Klungkung",
    TA: "Tabanan",
    BD: "Badung",
    DP: "Denpasar",
  };
  const types: { [key: string]: string } = {
    AP: "Alpukat", // Avocado
    DU: "Durian", // Durian
    MA: "Mangga", // Mango
    KE: "Kelapa", // Coconut
    JE: "Jeruk", // Orange
    PI: "Pisang", // Banana
    RA: "Rambutan", // Rambutan
    NA: "Nangka", // Jackfruit
    SA: "Sawo", // Sapodilla
    JA: "Jambu", // Guava
    TR: "Terong", // Eggplant
  };
  const subtypes: { [key: string]: string } = {
    M: "Manalagi", // Common for Alpukat or Mangga
    H: "Hass", // Alpukat subtype
    T: "Monthong", // Durian subtype
    A: "Arumanis", // Mangga subtype
    C: "Cengkir", // Mangga subtype
    S: "Siam", // Pisang or Jeruk subtype
    R: "Raja", // Pisang subtype
    B: "Bali", // Jambu subtype
    K: "Kuning", // Kelapa subtype
    G: "Gandaria", // Subtype or variant for Jambu
  };

  return {
    location: locations[parsed.locationCode] || "Unknown",
    type: types[parsed.farmType] || "Unknown",
    subtype: subtypes[parsed.subtype] || "Unknown",
    number: parsed.number,
  };
};

export const getAnimalDetails = (id: string) => {
  const parsed = parseTreeId(id);

  const locations: { [key: string]: string } = {
    KR: "Karangasem",
    BA: "Bangli",
    BU: "Buleleng",
    GI: "Gianyar",
    JE: "Jembrana",
    KL: "Klungkung",
    TA: "Tabanan",
    BD: "Badung",
    DP: "Denpasar",
  };

  const animalTypes: { [key: string]: string } = {
    AP: "Ayam Petelur", // Egg-laying Chicken
    AB: "Ayam Broiler", // Broiler Chicken
    SA: "Sapi", // Cow
    KE: "Kambing", // Goat
    BE: "Bebek", // Duck
    DO: "Domba", // Sheep
    BU: "Babi", // Pig
    KU: "Kelinci", // Rabbit
    IK: "Ikan", // Fish
  };

  const subtypes: { [key: string]: string } = {
    M: "Medium", // Medium size
    L: "Large", // Large size
    S: "Small", // Small size
    B: "Bali", // Bali breed (e.g., for Sapi)
    K: "Kampung", // Kampung breed (e.g., for Ayam)
    H: "Holstein", // Holstein breed (e.g., for Sapi)
    E: "Ekor Panjang", // Long-tail (e.g., for Kambing)
    P: "Pekin", // Pekin breed (e.g., for Bebek)
    G: "Guppy", // Guppy breed (e.g., for Ikan)
  };

  return {
    location: locations[parsed.locationCode] || "Unknown",
    type: animalTypes[parsed.farmType] || "Unknown",
    subtype: subtypes[parsed.subtype] || "Unknown",
    number: parsed.number,
  };
};
