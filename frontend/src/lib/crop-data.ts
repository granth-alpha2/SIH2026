/**
 * AgriProfit — Curated Crop Agronomic & Economic Catalog
 * =======================================================
 * Sourced from ICAR package of practices, CACP Price Policy reports (2024-25),
 * and Agmarknet mandi benchmarks.
 */

export type CropCategory = "Cereal" | "Pulse" | "Oilseed" | "Cash Crop" | "Vegetable" | "Spice" | "Fruit";
export type CropSeason = "Kharif" | "Rabi" | "Zaid" | "Perennial";

export type CropRecord = {
  id: string;
  slug: string;
  name: string;
  hindiName: string;
  category: CropCategory;
  season: CropSeason;
  durationDays: number;
  waterRequirementMm: number;
  waterLevel: "Low" | "Medium" | "High";
  suitableSoils: string[];
  tempRange: { min: number; max: number; idealMin: number; idealMax: number };
  rainfallMm: { min: number; max: number; optimal: number };
  yield: { kgPerHa: number; quintalsPerAcre: number };
  costs: {
    seed: number;
    fertilizer: number;
    labor: number;
    irrigation: number;
    other: number;
    totalPerAcre: number;
    totalPerHa: number;
  };
  economics: {
    typicalPricePerQuintal: number;
    mspPricePerQuintal: number | null;
    mspEligible: boolean;
    expectedGrossRevenuePerAcre: number;
    expectedNetProfitPerAcre: number;
    roi: number;
  };
  riskFactors: string[];
  pestsAndDiseases: string[];
  provenance: {
    sourceType: "official" | "estimated";
    benchmarkSource: string;
    lastUpdated: string;
  };
};

export const CROP_DATABASE: CropRecord[] = [
  {
    id: "CROP002",
    slug: "wheat",
    name: "Wheat (Gehun)",
    hindiName: "गेहूं",
    category: "Cereal",
    season: "Rabi",
    durationDays: 130,
    waterRequirementMm: 450,
    waterLevel: "Medium",
    suitableSoils: ["Loam", "Clay loam", "Alluvial"],
    tempRange: { min: 4, max: 32, idealMin: 15, idealMax: 25 },
    rainfallMm: { min: 350, max: 750, optimal: 500 },
    yield: { kgPerHa: 3600, quintalsPerAcre: 14.5 },
    costs: {
      seed: 1700,
      fertilizer: 3000,
      labor: 4000,
      irrigation: 1800,
      other: 1000,
      totalPerAcre: 11500,
      totalPerHa: 28700,
    },
    economics: {
      typicalPricePerQuintal: 2380,
      mspPricePerQuintal: 2275,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 34510,
      expectedNetProfitPerAcre: 23010,
      roi: 2.0,
    },
    riskFactors: ["Terminal heat stress in February/March", "Lodging during untimely rain", "Yellow rust epidemic"],
    pestsAndDiseases: ["Yellow / Stripe Rust (Puccinia striiformis)", "Karnal Bunt", "Aphids (Mahun)"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-IIWBR Karnal / CACP Rabi MSP 2024-25",
      lastUpdated: "2024-10-15",
    },
  },
  {
    id: "CROP013",
    slug: "mustard",
    name: "Mustard (Sarson)",
    hindiName: "सरसों",
    category: "Oilseed",
    season: "Rabi",
    durationDays: 120,
    waterRequirementMm: 350,
    waterLevel: "Low",
    suitableSoils: ["Loam", "Sandy loam", "Alluvial"],
    tempRange: { min: 5, max: 30, idealMin: 15, idealMax: 25 },
    rainfallMm: { min: 250, max: 500, optimal: 350 },
    yield: { kgPerHa: 1500, quintalsPerAcre: 6.1 },
    costs: {
      seed: 900,
      fertilizer: 1600,
      labor: 2800,
      irrigation: 1000,
      other: 600,
      totalPerAcre: 6900,
      totalPerHa: 17200,
    },
    economics: {
      typicalPricePerQuintal: 5650,
      mspPricePerQuintal: 5650,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 34465,
      expectedNetProfitPerAcre: 27565,
      roi: 3.0,
    },
    riskFactors: ["Aphid attack during flowering", "Frost damage during pod formation", "Sclerotinia stem rot"],
    pestsAndDiseases: ["Mustard Aphid (Lipaphis erysimi)", "White Rust (Albugo candida)", "Alternaria Blight"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-DRMR Bharatpur / CACP 2024-25",
      lastUpdated: "2024-10-15",
    },
  },
  {
    id: "CROP007",
    slug: "chickpea",
    name: "Chickpea / Gram (Chana)",
    hindiName: "चना",
    category: "Pulse",
    season: "Rabi",
    durationDays: 100,
    waterRequirementMm: 350,
    waterLevel: "Low",
    suitableSoils: ["Sandy loam", "Loam", "Black soil"],
    tempRange: { min: 10, max: 30, idealMin: 18, idealMax: 25 },
    rainfallMm: { min: 250, max: 500, optimal: 350 },
    yield: { kgPerHa: 1200, quintalsPerAcre: 4.8 },
    costs: {
      seed: 1400,
      fertilizer: 1600,
      labor: 3200,
      irrigation: 800,
      other: 600,
      totalPerAcre: 7600,
      totalPerHa: 19000,
    },
    economics: {
      typicalPricePerQuintal: 5440,
      mspPricePerQuintal: 5440,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 26112,
      expectedNetProfitPerAcre: 18512,
      roi: 2.43,
    },
    riskFactors: ["Pod borer (Helicoverpa)", "Waterlogging (highly sensitive)", "Fusarium wilt"],
    pestsAndDiseases: ["Gram Pod Borer (Helicoverpa armigera)", "Fusarium Wilt", "Ascochyta Blight"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-IIPR Kanpur / CACP 2024-25",
      lastUpdated: "2024-10-15",
    },
  },
  {
    id: "CROP003",
    slug: "maize",
    name: "Maize (Makka)",
    hindiName: "मक्का",
    category: "Cereal",
    season: "Kharif",
    durationDays: 100,
    waterRequirementMm: 550,
    waterLevel: "Medium",
    suitableSoils: ["Loam", "Alluvial", "Red loam"],
    tempRange: { min: 10, max: 35, idealMin: 21, idealMax: 27 },
    rainfallMm: { min: 450, max: 900, optimal: 600 },
    yield: { kgPerHa: 3200, quintalsPerAcre: 13.0 },
    costs: {
      seed: 1500,
      fertilizer: 2600,
      labor: 3600,
      irrigation: 1400,
      other: 900,
      totalPerAcre: 10000,
      totalPerHa: 25000,
    },
    economics: {
      typicalPricePerQuintal: 2150,
      mspPricePerQuintal: 2090,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 27950,
      expectedNetProfitPerAcre: 17950,
      roi: 1.8,
    },
    riskFactors: ["Fall Armyworm infestation", "Waterlogging during seedling stage", "Early post-monsoon drought"],
    pestsAndDiseases: ["Fall Armyworm (Spodoptera frugiperda)", "Stem Borer", "Turcicum Leaf Blight"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-IIMR Ludhiana / CACP Kharif 2024",
      lastUpdated: "2024-06-15",
    },
  },
  {
    id: "CROP011",
    slug: "soybean",
    name: "Soybean",
    hindiName: "सोयाबीन",
    category: "Oilseed",
    season: "Kharif",
    durationDays: 100,
    waterRequirementMm: 600,
    waterLevel: "Medium",
    suitableSoils: ["Black soil", "Loam", "Clay loam"],
    tempRange: { min: 18, max: 32, idealMin: 24, idealMax: 28 },
    rainfallMm: { min: 500, max: 900, optimal: 650 },
    yield: { kgPerHa: 1500, quintalsPerAcre: 6.0 },
    costs: {
      seed: 1300,
      fertilizer: 1800,
      labor: 3200,
      irrigation: 800,
      other: 700,
      totalPerAcre: 7800,
      totalPerHa: 19500,
    },
    economics: {
      typicalPricePerQuintal: 4680,
      mspPricePerQuintal: 4600,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 28080,
      expectedNetProfitPerAcre: 20280,
      roi: 2.6,
    },
    riskFactors: ["Heavy moisture during harvesting", "Girdle beetle damage", "Yellow Mosaic Virus"],
    pestsAndDiseases: ["Girdle Beetle", "Semilooper", "Yellow Mosaic Virus"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-IISR Indore / CACP 2024",
      lastUpdated: "2024-06-15",
    },
  },
  {
    id: "CROP016",
    slug: "cotton",
    name: "Cotton (Kapas)",
    hindiName: "कपास",
    category: "Cash Crop",
    season: "Kharif",
    durationDays: 180,
    waterRequirementMm: 700,
    waterLevel: "Medium",
    suitableSoils: ["Black soil", "Alluvial", "Deep loam"],
    tempRange: { min: 15, max: 40, idealMin: 25, idealMax: 32 },
    rainfallMm: { min: 500, max: 1000, optimal: 700 },
    yield: { kgPerHa: 550, quintalsPerAcre: 6.5 },
    costs: {
      seed: 2200,
      fertilizer: 4000,
      labor: 8000,
      irrigation: 2400,
      other: 1600,
      totalPerAcre: 18200,
      totalPerHa: 45500,
    },
    economics: {
      typicalPricePerQuintal: 6920,
      mspPricePerQuintal: 6620,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 44980,
      expectedNetProfitPerAcre: 26780,
      roi: 1.47,
    },
    riskFactors: ["Pink Bollworm resistance", "Whitefly outbreaks (Cotton Leaf Curl Virus)", "Price volatility"],
    pestsAndDiseases: ["Pink Bollworm (Pectinophora gossypiella)", "Whitefly", "Bacterial Blight"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-CICR Nagpur / CACP 2024",
      lastUpdated: "2024-06-15",
    },
  },
  {
    id: "CROP020",
    slug: "onion",
    name: "Onion (Pyaz)",
    hindiName: "प्याज",
    category: "Vegetable",
    season: "Rabi",
    durationDays: 120,
    waterRequirementMm: 450,
    waterLevel: "Medium",
    suitableSoils: ["Loam", "Sandy loam", "Alluvial"],
    tempRange: { min: 10, max: 32, idealMin: 13, idealMax: 25 },
    rainfallMm: { min: 350, max: 650, optimal: 450 },
    yield: { kgPerHa: 18000, quintalsPerAcre: 72.8 },
    costs: {
      seed: 3600,
      fertilizer: 4000,
      labor: 8800,
      irrigation: 2800,
      other: 1600,
      totalPerAcre: 20800,
      totalPerHa: 52000,
    },
    economics: {
      typicalPricePerQuintal: 2850,
      mspPricePerQuintal: null,
      mspEligible: false,
      expectedGrossRevenuePerAcre: 207480,
      expectedNetProfitPerAcre: 186680,
      roi: 8.97,
    },
    riskFactors: ["Extreme price crash / gluts", "Post-harvest storage rot", "Purple blotch disease"],
    pestsAndDiseases: ["Thrips (Thrips tabaci)", "Purple Blotch (Alternaria porri)", "Stemphylium Leaf Blight"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-DOGR Rajgurunagar / Agmarknet Lasalgaon 2024",
      lastUpdated: "2024-08-01",
    },
  },
  {
    id: "CROP019",
    slug: "potato",
    name: "Potato (Aloo)",
    hindiName: "आलू",
    category: "Vegetable",
    season: "Rabi",
    durationDays: 100,
    waterRequirementMm: 500,
    waterLevel: "Medium",
    suitableSoils: ["Sandy loam", "Alluvial", "Loam"],
    tempRange: { min: 10, max: 28, idealMin: 15, idealMax: 22 },
    rainfallMm: { min: 300, max: 600, optimal: 450 },
    yield: { kgPerHa: 22000, quintalsPerAcre: 89.0 },
    costs: {
      seed: 7200,
      fertilizer: 6000,
      labor: 8000,
      irrigation: 3200,
      other: 2000,
      totalPerAcre: 26400,
      totalPerHa: 66000,
    },
    economics: {
      typicalPricePerQuintal: 1450,
      mspPricePerQuintal: null,
      mspEligible: false,
      expectedGrossRevenuePerAcre: 129050,
      expectedNetProfitPerAcre: 102650,
      roi: 2.88,
    },
    riskFactors: ["Late blight during foggy cloudy periods", "Cold storage availability", "Seed tuber quality"],
    pestsAndDiseases: ["Late Blight (Phytophthora infestans)", "Early Blight", "Potato Tuber Moth"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-CPRI Shimla / NHB 2024",
      lastUpdated: "2024-08-01",
    },
  },
  {
    id: "CROP001",
    slug: "paddy",
    name: "Paddy / Rice (Dhan)",
    hindiName: "धान",
    category: "Cereal",
    season: "Kharif",
    durationDays: 130,
    waterRequirementMm: 1250,
    waterLevel: "High",
    suitableSoils: ["Clay loam", "Clay", "Alluvial"],
    tempRange: { min: 10, max: 40, idealMin: 20, idealMax: 35 },
    rainfallMm: { min: 900, max: 1800, optimal: 1200 },
    yield: { kgPerHa: 4200, quintalsPerAcre: 17.0 },
    costs: {
      seed: 1800,
      fertilizer: 3600,
      labor: 7200,
      irrigation: 2800,
      other: 1200,
      totalPerAcre: 16600,
      totalPerHa: 41500,
    },
    economics: {
      typicalPricePerQuintal: 2320,
      mspPricePerQuintal: 2300,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 39440,
      expectedNetProfitPerAcre: 22840,
      roi: 1.37,
    },
    riskFactors: ["Groundwater depletion in tube-well areas", "Blast & Brown Planthopper outbreaks", "High electricity costs"],
    pestsAndDiseases: ["Bacterial Leaf Blight", "Rice Blast (Magnaporthe oryzae)", "Brown Plant Hopper"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-NRRI Cuttack / CACP 2024",
      lastUpdated: "2024-06-15",
    },
  },
  {
    id: "CROP012",
    slug: "groundnut",
    name: "Groundnut (Mungfali)",
    hindiName: "मूंगफली",
    category: "Oilseed",
    season: "Kharif",
    durationDays: 110,
    waterRequirementMm: 550,
    waterLevel: "Medium",
    suitableSoils: ["Sandy loam", "Red sandy loam", "Loam"],
    tempRange: { min: 20, max: 35, idealMin: 25, idealMax: 30 },
    rainfallMm: { min: 450, max: 750, optimal: 550 },
    yield: { kgPerHa: 1900, quintalsPerAcre: 7.7 },
    costs: {
      seed: 1600,
      fertilizer: 2000,
      labor: 3800,
      irrigation: 1200,
      other: 800,
      totalPerAcre: 9400,
      totalPerHa: 23500,
    },
    economics: {
      typicalPricePerQuintal: 6380,
      mspPricePerQuintal: 6377,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 49126,
      expectedNetProfitPerAcre: 39726,
      roi: 3.22,
    },
    riskFactors: ["Tikka leaf spot during humid rains", "Soil crusting affecting peg penetration", "White grub"],
    pestsAndDiseases: ["Tikka Disease (Cercospora personata)", "White Grub", "Collar Rot"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-DGR Junagadh / CACP 2024",
      lastUpdated: "2024-06-15",
    },
  },
  {
    id: "CROP017",
    slug: "sugarcane",
    name: "Sugarcane (Ganna)",
    hindiName: "गन्ना",
    category: "Cash Crop",
    season: "Perennial",
    durationDays: 360,
    waterRequirementMm: 2000,
    waterLevel: "High",
    suitableSoils: ["Deep loam", "Alluvial", "Clay loam"],
    tempRange: { min: 18, max: 38, idealMin: 25, idealMax: 32 },
    rainfallMm: { min: 1200, max: 2500, optimal: 1500 },
    yield: { kgPerHa: 80000, quintalsPerAcre: 324.0 },
    costs: {
      seed: 3200,
      fertilizer: 7200,
      labor: 14000,
      irrigation: 6000,
      other: 3200,
      totalPerAcre: 33600,
      totalPerHa: 84000,
    },
    economics: {
      typicalPricePerQuintal: 340, // FRP per quintal
      mspPricePerQuintal: 340,
      mspEligible: true,
      expectedGrossRevenuePerAcre: 110160,
      expectedNetProfitPerAcre: 76560,
      roi: 2.27,
    },
    riskFactors: ["Delayed mill payments", "High water & power consumption", "Red rot disease"],
    pestsAndDiseases: ["Red Rot (Colletotrichum falcatum)", "Early Shoot Borer", "Pyrilla"],
    provenance: {
      sourceType: "official",
      benchmarkSource: "ICAR-IISR Lucknow / CACP FRP 2024-25",
      lastUpdated: "2024-08-01",
    },
  },
];

