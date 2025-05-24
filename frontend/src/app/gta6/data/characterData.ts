export interface CharacterInfo {
  name: string;
  officialDescription: string[];
}

export interface Character {
  id: string;
  name: string;
  mainImage: string;
  bgImagePath: string;
  fgImagePath: string;
  additionalImages: string[];
  info: CharacterInfo;
}

export const characters: Character[] = [
  {
    id: 'jason',
    name: 'Jason Duval',
    mainImage: 'jason/Jason_Duval_01.jpeg',
    bgImagePath: '/gta6/characters/jason/Hero_BG_Jason_Duval.jpeg',
    fgImagePath: '',
    additionalImages: [
      'jason/Jason_Duval_02.jpeg', 
      'jason/Jason_Duval_03.jpeg', 
      'jason/Jason_Duval_04.jpeg', 
      'jason/Jason_Duval_05.jpeg'
    ],
    info: {
      name: 'Jason Duval',
      officialDescription: [
        "Jason wants an easy life, but things just keep getting harder.",
        "Jason grew up around grifters and crooks. After a stint in the Army trying to shake off his troubled teens, he found himself in the Keys doing what he knows best, working for local drug runners. It might be time to try something new.",
        "If anything happens, I'm right behind you.",
        "Another day in paradise, right?",
        "Meeting Lucia could be the best or worst thing to ever happen to him. Jason knows how he'd like it to turn out but right now, it's hard to tell."
      ]
    }
  },
  {
    id: 'lucia',
    name: 'Lucia Caminos',
    mainImage: 'lucia/Lucia_Caminos_01.jpeg',
    bgImagePath: '/gta6/characters/lucia/Hero_BG_Lucia_caminos.jpeg',
    fgImagePath: '',
    additionalImages: [
      'lucia/Lucia_Caminos_02.jpeg', 
      'lucia/Lucia_Caminos_03.jpeg', 
      'lucia/Lucia_Caminos_04.jpeg', 
      'lucia/Lucia_Caminos_05.jpeg'
    ],
    info: {
      name: 'Lucia Caminos',
      officialDescription: [
        "Lucia's father taught her to fight as soon as she could walk.",
        "Life has been coming at her swinging ever since. Fighting for her family landed her in the Leonida Penitentiary. Sheer luck got her out. Lucia's learned her lesson — only smart moves from here.",
        "More than anything, Lucia wants the good life her mom has dreamed of since their days in Liberty City — but instead of half-baked fantasies, Lucia is prepared to take matters into her own hands.",
        "The only thing that matters is who you know and what you got.",
        "Fresh out of prison and ready to change the odds in her favor, Lucia's committed to her plan — no matter what it takes.",
        "A life with Jason could be her way out."
      ]
    }
  },
  {
    id: 'cal',
    name: 'Cal Hampton',
    mainImage: 'cal/Cal_Hampton_01.jpeg',
    bgImagePath: '/gta6/characters/cal/Hero_BG_Cal_Hampton.jpeg',
    fgImagePath: '/gta6/characters/cal/Hero_FG_Cal_Hampton.png',
    additionalImages: [
      'cal/Cal_Hampton_02.jpeg', 
      'cal/Cal_Hampton_03.jpeg', 
      'cal/Cal_Hampton_04.jpeg'
    ],
    info: {
      name: 'Cal Hampton',
      officialDescription: [
        "What if everything on the internet was true?",
        "Jason's friend and a fellow associate of Brian's, Cal feels safest hanging at home, snooping on Coast Guard comms with a few beers and some private browser tabs open.",
        "There are way too many birds flying around in perfect formation.",
        "The psychopaths are in charge. Get used to it.",
        "Cal is at the low tide of America and happy there. Casual paranoia loves company, but his friend Jason has bigger plans."
      ]
    }
  },
  {
    id: 'boobie',
    name: 'Boobie Ike',
    mainImage: 'boobie/Boobie_Ike_01.jpeg',
    bgImagePath: '/gta6/characters/boobie/Hero_BG_Boobie_Ike(1).jpeg',
    fgImagePath: '/gta6/characters/boobie/Hero_FG_Boobie_Ike(1).png',
    additionalImages: [
      'boobie/Boobie_Ike_02.jpeg', 
      'boobie/Boobie_Ike_03.jpeg', 
      'boobie/Boobie_Ike_04.jpeg',
    ],
    info: {
      name: 'Boobie Ike',
      officialDescription: [
        "It's all about heart — the Jack of Hearts.",
        "Boobie is a local Vice City legend — and acts like it. One of the few to transform his time in the streets into a legitimate empire spanning real estate, a strip club, and a recording studio — Boobie's all smiles until it's time to talk business.",
        "The club money pay for the studio, and the drug money pay for it all.",
        "Top quality cuts.",
        "Boobie might seem like he's just out for himself, but it's his partnership with the young aspiring music mogul Dre'Quan for Only Raw Records that he's most invested in — now they just need a hit."
      ]
    }
  },
  {
    id: 'dre',
    name: 'Dre\'Quan Priest',
    mainImage: 'dre/DreQuan_Priest_01.jpeg',
    bgImagePath: '/gta6/characters/dre/Hero_BG_DreQuan_Priest(2).jpeg',
    fgImagePath: '/gta6/characters/dre/Hero_FG_DreQuan_Priest(2).png',
    additionalImages: [
      'dre/DreQuan_Priest_02.jpeg', 
      'dre/DreQuan_Priest_03.jpeg', 
      'dre/DreQuan_Priest_04.jpeg',
    ],
    info: {
      name: 'Dre\'Quan Priest',
      officialDescription: [
        "Only Raw... Records",
        "Dre'Quan was always more of a hustler than a gangster. Even when he was dealing on the streets to make ends meet, breaking into music was the goal.",
        "Dancers are like my A&Rs. If the record's a hit, DJs gonna be spinnin' it.",
        "You're with the label now.",
        "Now that he's signed the Real Dimez, Dre'Quan's days of booking acts into Boobie's strip club might be numbered as he sets his sights on the Vice City scene."
      ]
    }
  },
  {
    id: 'real',
    name: 'Real Dimez',
    mainImage: 'real/Real_Dimez_01.jpeg',
    bgImagePath: '/gta6/characters/real/Hero_BG_Real_Dimez(3).jpeg',
    fgImagePath: '/gta6/characters/real/Hero_FG_Real_Dimez(3).png',
    additionalImages: [
      'real/Real_Dimez_02.jpeg', 
      'real/Real_Dimez_03.jpeg', 
      'real/Real_Dimez_04.jpeg'
    ],
    info: {
      name: 'Real Dimez',
      officialDescription: [
        "Viral videos. Viral hooks.",
        "Bae-Luxe and Roxy aka Real Dimez have been friends since high school — girls with the savvy to turn their time shaking down local dealers into cold, hard cash via spicy rap tracks and a relentless social media presence.",
        "All my dimes in this club. Meet my twin, make it a dub.",
        "One hit away from fame.",
        "An early hit single with local rapper DWNPLY took Real Dimez to new heights. Now, after five years and a whole lot of trouble, they're signed to Only Raw Records, hoping lightning can strike twice."
      ]
    }
  },
  {
    id: 'raul',
    name: 'Raul Bautista',
    mainImage: 'raul/Raul_Bautista_01.jpeg',
    bgImagePath: '/gta6/characters/raul/Hero_BG_Raul_Bautista(4).jpeg',
    fgImagePath: '/gta6/characters/raul/Hero_FG_Raul_Bautista(4).png',
    additionalImages: [
      'raul/Raul_Bautista_02.jpeg', 
      'raul/Raul_Bautista_03.jpeg', 
      'raul/Raul_Bautista_04.jpeg',
    ],
    info: {
      name: 'Raul Bautista',
      officialDescription: [
        "Experience counts.",
        "Confidence, charm, and cunning — Raul's a seasoned bank robber always on the hunt for talent ready to take the risks that bring the biggest rewards.",
        "Life is full of surprises, my friend. I think we'd all be wise to remember that.",
        "A professional adapts.",
        "Raul's recklessness raises the stakes with every score. Sooner or later, his crew will have to double down or pull their chips from the table."
      ]
    }
  },
  {
    id: 'brian',
    name: 'Brian Heder',
    mainImage: 'brian/Brian_Heder_01.jpeg',
    bgImagePath: '/gta6/characters/brian/Hero_BG_Brian_Heder(5).jpeg',
    fgImagePath: '/gta6/characters/brian/Hero_FG_Brian_Heder(5).png',
    additionalImages: [
      'brian/Brian_Heder_02.jpeg', 
      'brian/Brian_Heder_03.jpeg', 
      'brian/Brian_Heder_04.jpeg'
    ],
    info: {
      name: 'Brian Heder',
      officialDescription: [
        "Nothing better than a Mudslide at sunset.",
        "Brian's a classic drug runner from the golden age of smuggling in the Keys. Still moving product through his boat yard with his third wife, Lori, Brian's been around long enough to let others do his dirty work.",
        "I hauled so much grass in that plane, I could make the state of Leonida levitate.",
        "Looks like a Leonida beach bum — moves like a great white shark.",
        "Brian's letting Jason live rent-free at one of his properties — so long as he helps with local shakedowns, and stops by for Lori's sangria once in a while."
      ]
    }
  }
]; 