export interface PetLevel {
  [level: string]: number;
}

export interface Pet {
  pet: string;
  skill: string;
  stat: string;
  levels: PetLevel;
}

export interface PetsData {
  [petName: string]: Pet;
}

export const PETS_DATA: PetsData = {
  "Saber-tooth Tiger": {
    pet: "Saber-tooth Tiger",
    skill: "Apex Assault",
    stat: "Troops Lethality",
    levels: {
      "1": 2.5,
      "2": 3.0,
      "3": 3.5,
      "4": 4.0,
      "5": 5.0,
      "6": 6.0,
      "7": 7.0,
      "8": 8.0,
      "9": 9.0,
      "10": 10.0
    }
  },
  "Frost Gorilla": {
    pet: "Frost Gorilla",
    skill: "Earthbound Vigor",
    stat: "Troops Health",
    levels: {
      "1": 2.5,
      "2": 3.0,
      "3": 3.5,
      "4": 4.0,
      "5": 5.0,
      "6": 6.0,
      "7": 7.0,
      "8": 8.0,
      "9": 9.0,
      "10": 10.0
    }
  },
  "Cave Lion": {
    pet: "Cave Lion",
    skill: "Feral Anthem",
    stat: "All Troops Attack",
    levels: {
      "1": 2.5,
      "2": 3.0,
      "3": 3.5,
      "4": 4.0,
      "5": 5.0,
      "6": 6.0,
      "7": 7.0,
      "8": 8.0,
      "9": 9.0,
      "10": 10.0
    }
  },
  "Frostscale Chameleon": {
    pet: "Frostscale Chameleon",
    skill: "Fogbreath",
    stat: "Enemy Troops Defense Reduction",
    levels: {
      "1": 2.5,
      "2": 3.0,
      "3": 3.5,
      "4": 4.0,
      "5": 5.0,
      "6": 6.0,
      "7": 7.0,
      "8": 8.0,
      "9": 9.0,
      "10": 10.0
    }
  },
  "Mammoth": {
    pet: "Mammoth",
    skill: "Hardened Skin",
    stat: "Troops Defense",
    levels: {
      "1": 2.5,
      "2": 3.0,
      "3": 3.5,
      "4": 4.0,
      "5": 5.0,
      "6": 6.0,
      "7": 7.0,
      "8": 8.0,
      "9": 9.0,
      "10": 10.0
    }
  },
  "Snow Ape": {
    pet: "Snow Ape",
    skill: "Tumbling Power",
    stat: "Squad Capacity",
    levels: {
      "1": 1500,
      "2": 3000,
      "3": 4500,
      "4": 6000,
      "5": 7500,
      "6": 9000,
      "7": 10500,
      "8": 12000,
      "9": 13500,
      "10": 15000
    }
  },
  "Rhino": {
    pet: "Rhino",
    skill: "Rallying Beasts",
    stat: "Rally Capacity",
    levels: {
      "1": 60000,
      "2": 70000,
      "3": 80000,
      "4": 90000,
      "5": 100000,
      "6": 110000,
      "7": 120000,
      "8": 130000,
      "9": 140000,
      "10": 150000
    }
  },
  "Titan Roc": {
    pet: "Titan Roc",
    skill: "Razorbeak",
    stat: "Enemy Health Reduction",
    levels: {
      "1": 1.5,
      "2": 2.0,
      "3": 2.5,
      "4": 3.0,
      "5": 3.5,
      "6": 4.0,
      "7": 5.0
    }
  }
};
