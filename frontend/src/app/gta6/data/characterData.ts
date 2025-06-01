export interface CharacterInfo {
  name: string;
  officialDescription: string[];
  expandedDescription?: string[];
  nickname?: string;
  skills?: string[];
  personalityTraits?: string[];
  relationships?: Record<string, string>;
}

export interface Character {
  id: string;
  name: string;
  mainImage: string;
  bgImagePath: string;
  fgImagePath: string;
  additionalImages: string[];
  info: CharacterInfo;
  locations?: string[];
}

export const characters: Character[] = [
  {
    id: 'jason',
    name: 'Jason Duval',
    mainImage: 'Jason Duval/Jason_Duval_01.jpg',
    bgImagePath: '/vi/people/Jason Duval/Jason_Duval_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'Jason Duval/Jason_Duval_02.jpg', 
      'Jason Duval/Jason_Duval_03.jpg', 
      'Jason Duval/Jason_Duval_04.jpg', 
      'Jason Duval/Jason_Duval_05.jpg'
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
    mainImage: 'Lucia Caminos/Lucia_Caminos_01.jpg',
    bgImagePath: '/vi/people/Lucia Caminos/Lucia_Caminos_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'Lucia Caminos/Lucia_Caminos_02.jpg', 
      'Lucia Caminos/Lucia_Caminos_03.jpg', 
      'Lucia Caminos/Lucia_Caminos_04.jpg', 
      'Lucia Caminos/Lucia_Caminos_05.jpg'
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
    mainImage: 'Cal Hampton/Cal_Hampton_01.jpg',
    bgImagePath: '/vi/people/Cal Hampton/Cal_Hampton_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'Cal Hampton/Cal_Hampton_02.jpg', 
      'Cal Hampton/Cal_Hampton_03.jpg', 
      'Cal Hampton/Cal_Hampton_04.jpg'
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
    mainImage: 'Boobie Ike/Boobie_Ike_01.jpg',
    bgImagePath: '/vi/people/Boobie Ike/Boobie_Ike_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'Boobie Ike/Boobie_Ike_02.jpg', 
      'Boobie Ike/Boobie_Ike_03.jpg', 
      'Boobie Ike/Boobie_Ike_04.jpg',
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
    mainImage: 'DreQuan Priest/DreQuan_Priest_01.jpg',
    bgImagePath: '/vi/people/DreQuan Priest/DreQuan_Priest_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'DreQuan Priest/DreQuan_Priest_02.jpg', 
      'DreQuan Priest/DreQuan_Priest_03.jpg', 
      'DreQuan Priest/DreQuan_Priest_04.jpg',
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
    mainImage: 'Real Dimez/Real_Dimez_01.jpg',
    bgImagePath: '/vi/people/Real Dimez/Real_Dimez_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'Real Dimez/Real_Dimez_02.jpg', 
      'Real Dimez/Real_Dimez_03.jpg', 
      'Real Dimez/Real_Dimez_04.jpg'
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
    mainImage: 'Raul Bautista/Raul_Bautista_01.jpg',
    bgImagePath: '/vi/people/Raul Bautista/Raul_Bautista_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'Raul Bautista/Raul_Bautista_02.jpg', 
      'Raul Bautista/Raul_Bautista_03.jpg', 
      'Raul Bautista/Raul_Bautista_04.jpg',
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
    mainImage: 'Brian Heder/Brian_Heder_01.jpg',
    bgImagePath: '/vi/people/Brian Heder/Brian_Heder_01.jpg',
    fgImagePath: '',
    additionalImages: [
      'Brian Heder/Brian_Heder_02.jpg', 
      'Brian Heder/Brian_Heder_03.jpg', 
      'Brian Heder/Brian_Heder_04.jpg'
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