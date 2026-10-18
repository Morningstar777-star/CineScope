export interface CuratedTitle {
  id: string;
  title: string;
  media_type: 'movie' | 'anime' | 'series';
  release_year: number;
  poster_url: string;
  overall_score: number;
  verdict: string;
  genre: string;
}

export interface CuratedShelf {
  id: string;
  title: string;
  badge: string;
  tagline: string;
  items: CuratedTitle[];
}

export const CURATED_SHELVES: CuratedShelf[] = [
  {
    id: 'highest-rated-anime',
    title: '⚔️ Highest Rated Anime Masterpieces',
    badge: 'S-TIER ANIMATION',
    tagline: 'Definitive shonen, psychological epics, and world-renowned Japanese animation.',
    items: [
      {
        id: 'anilist_16498',
        title: 'Attack on Titan',
        media_type: 'anime',
        release_year: 2013,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
        overall_score: 9.2,
        verdict: 'Masterpiece',
        genre: 'Dark Fantasy • Action'
      },
      {
        id: 'anilist_5114',
        title: 'Fullmetal Alchemist: Brotherhood',
        media_type: 'anime',
        release_year: 2009,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg',
        overall_score: 9.3,
        verdict: 'Legendary',
        genre: 'Adventure • Drama'
      },
      {
        id: 'anilist_154587',
        title: 'Frieren: Beyond Journey\'s End',
        media_type: 'anime',
        release_year: 2023,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',
        overall_score: 9.4,
        verdict: 'Universal Acclaim',
        genre: 'Fantasy • Drama'
      },
      {
        id: 'anilist_171627',
        title: 'Chainsaw Man',
        media_type: 'anime',
        release_year: 2022,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171627-ZN9D7P46yHnw.png',
        overall_score: 8.8,
        verdict: 'Acclaimed',
        genre: 'Supernatural • Action'
      },
      {
        id: 'anilist_1535',
        title: 'Death Note',
        media_type: 'anime',
        release_year: 2006,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg',
        overall_score: 8.9,
        verdict: 'Masterpiece',
        genre: 'Psychological • Mystery'
      },
      {
        id: 'anilist_9253',
        title: 'Steins;Gate',
        media_type: 'anime',
        release_year: 2011,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-tIUXF2gfU8Sg.jpg',
        overall_score: 9.1,
        verdict: 'Masterpiece',
        genre: 'Sci-Fi • Thriller'
      },
      {
        id: 'anilist_113415',
        title: 'Jujutsu Kaisen',
        media_type: 'anime',
        release_year: 2020,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
        overall_score: 8.7,
        verdict: 'Acclaimed',
        genre: 'Action • Supernatural'
      },
      {
        id: 'anilist_101922',
        title: 'Demon Slayer: Kimetsu no Yaiba',
        media_type: 'anime',
        release_year: 2019,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
        overall_score: 8.6,
        verdict: 'Highly Rated',
        genre: 'Historical • Action'
      }
    ]
  },
  {
    id: 'highest-rated-indian',
    title: '🇮🇳 Highest Rated Indian Cinema',
    badge: 'GLOBAL MASTERPIECES',
    tagline: 'Monumental cinematic visions, groundbreaking storytelling, and worldwide audience acclaim.',
    items: [
      {
        id: 'wiki_RRR',
        title: 'RRR',
        media_type: 'movie',
        release_year: 2022,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/d/d7/RRR_Poster.jpg&w=480',
        overall_score: 9.0,
        verdict: 'Masterpiece',
        genre: 'Epic Action • Historical Fiction'
      },
      {
        id: 'wiki_Dangal_(film)',
        title: 'Dangal',
        media_type: 'movie',
        release_year: 2016,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/9/99/Dangal_Poster.jpg&w=480',
        overall_score: 8.9,
        verdict: 'Universal Acclaim',
        genre: 'Biographical • Sports Drama'
      },
      {
        id: 'wiki_Gangs_of_Wasseypur',
        title: 'Gangs of Wasseypur',
        media_type: 'movie',
        release_year: 2012,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/6/6a/Gangs_of_Wasseypur_poster.jpg&w=480',
        overall_score: 8.8,
        verdict: 'Cult Classic',
        genre: 'Crime Drama • Epic'
      },
      {
        id: 'wiki_Tumbbad',
        title: 'Tumbbad',
        media_type: 'movie',
        release_year: 2018,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/4/41/Tumbbad_poster.jpg&w=480',
        overall_score: 8.7,
        verdict: 'Masterpiece',
        genre: 'Folk Horror • Mythological'
      },
      {
        id: 'wiki_3_Idiots',
        title: '3 Idiots',
        media_type: 'movie',
        release_year: 2009,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg&w=480',
        overall_score: 8.9,
        verdict: 'All-Time Favorite',
        genre: 'Comedy • Coming-of-Age'
      },
      {
        id: 'wiki_Kantara_(film)',
        title: 'Kantara',
        media_type: 'movie',
        release_year: 2022,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/8/84/Kantara_poster.jpeg&w=480',
        overall_score: 8.6,
        verdict: 'Acclaimed',
        genre: 'Spiritual Folklore • Action'
      },
      {
        id: 'wiki_Lagaan',
        title: 'Lagaan',
        media_type: 'movie',
        release_year: 2001,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/b/b6/Lagaan.jpg&w=480',
        overall_score: 8.8,
        verdict: 'Oscar Nominee',
        genre: 'Epic Musical • Sports'
      },
      {
        id: 'wiki_Baahubali_2:_The_Conclusion',
        title: 'Baahubali 2: The Conclusion',
        media_type: 'movie',
        release_year: 2017,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/9/93/Baahubali_2_The_Conclusion_poster.jpg&w=480',
        overall_score: 8.7,
        verdict: 'Box Office Legend',
        genre: 'Fantasy • Action'
      }
    ]
  },
  {
    id: 'prestige-series',
    title: '📺 Prestige TV & Drama Series',
    badge: 'EMMY HEAVYWEIGHTS',
    tagline: 'Unmatched narrative architecture, character studies, and critical consensus.',
    items: [
      {
        id: 'wiki_Severance_(TV_series)',
        title: 'Severance',
        media_type: 'series',
        release_year: 2022,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/548/1371406.jpg',
        overall_score: 8.9,
        verdict: 'Masterpiece',
        genre: 'Sci-Fi • Psychological'
      },
      {
        id: 'wiki_Succession_(TV_series)',
        title: 'Succession',
        media_type: 'series',
        release_year: 2018,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/453/1134275.jpg',
        overall_score: 9.1,
        verdict: 'Legendary',
        genre: 'Satirical Drama'
      },
      {
        id: 'wiki_Breaking_Bad',
        title: 'Breaking Bad',
        media_type: 'series',
        release_year: 2008,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
        overall_score: 9.5,
        verdict: 'GOAT Status',
        genre: 'Crime • Thriller'
      },
      {
        id: 'wiki_The_Bear_(TV_series)',
        title: 'The Bear',
        media_type: 'series',
        release_year: 2022,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/629/1574642.jpg',
        overall_score: 8.8,
        verdict: 'Acclaimed',
        genre: 'Comedy-Drama'
      },
      {
        id: 'wiki_Chernobyl_(miniseries)',
        title: 'Chernobyl',
        media_type: 'series',
        release_year: 2019,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/193/482599.jpg',
        overall_score: 9.4,
        verdict: 'Masterpiece',
        genre: 'Historical Tragedy'
      },
      {
        id: 'wiki_Better_Call_Saul',
        title: 'Better Call Saul',
        media_type: 'series',
        release_year: 2015,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253515.jpg',
        overall_score: 9.2,
        verdict: 'Acclaimed',
        genre: 'Legal Crime Drama'
      },
      {
        id: 'wiki_Arcane_(TV_series)',
        title: 'Arcane',
        media_type: 'series',
        release_year: 2021,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/536/1340287.jpg',
        overall_score: 9.2,
        verdict: 'Masterpiece',
        genre: 'Animated Steampunk'
      }
    ]
  },
  {
    id: 'top-korean-series',
    title: '🇰🇷 Top Korean Series & Cinema',
    badge: 'GLOBAL SENSATIONS',
    tagline: 'High-concept thrills, intricate emotional depth, and award-winning Korean productions.',
    items: [
      {
        id: 'wiki_Parasite_(2019_film)',
        title: 'Parasite',
        media_type: 'movie',
        release_year: 2019,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png&w=480',
        overall_score: 9.3,
        verdict: 'Palme d\'Or Winner',
        genre: 'Black Comedy • Thriller'
      },
      {
        id: 'wiki_Squid_Game',
        title: 'Squid Game',
        media_type: 'series',
        release_year: 2021,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/576/1440521.jpg',
        overall_score: 8.8,
        verdict: 'Global Phenomenon',
        genre: 'Survival • Dystopian'
      },
      {
        id: 'wiki_The_Glory_(TV_series)',
        title: 'The Glory',
        media_type: 'series',
        release_year: 2022,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/433/1084564.jpg',
        overall_score: 8.7,
        verdict: 'Acclaimed',
        genre: 'Psychological Revenge'
      },
      {
        id: 'wiki_Crash_Landing_on_You',
        title: 'Crash Landing on You',
        media_type: 'series',
        release_year: 2019,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/235/588087.jpg',
        overall_score: 8.8,
        verdict: 'Beloved Classic',
        genre: 'Romantic Drama'
      },
      {
        id: 'wiki_Moving_(South_Korean_TV_series)',
        title: 'Moving',
        media_type: 'series',
        release_year: 2023,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/472/1181779.jpg',
        overall_score: 8.9,
        verdict: 'Masterpiece',
        genre: 'Supernatural Action'
      },
      {
        id: 'wiki_Kingdom_(South_Korean_TV_series)',
        title: 'Kingdom',
        media_type: 'series',
        release_year: 2019,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/116/291395.jpg',
        overall_score: 8.6,
        verdict: 'Acclaimed',
        genre: 'Period Zombie Horror'
      },
      {
        id: 'wiki_Memories_of_Murder',
        title: 'Memories of Murder',
        media_type: 'movie',
        release_year: 2003,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/0/01/Salinui-chueok-south-korean-movie-poster-md.jpg&w=480',
        overall_score: 9.0,
        verdict: 'Cinema Classic',
        genre: 'Crime • Mystery'
      }
    ]
  },
  {
    id: 'horror-psychological',
    title: '🩸 Mind-Bending Horror & Thrillers',
    badge: 'UNSETTLING DREAD',
    tagline: 'Airtight tension, atmospheric terror, and deeply haunting psychological mysteries.',
    items: [
      {
        id: 'wiki_Hereditary_(film)',
        title: 'Hereditary',
        media_type: 'movie',
        release_year: 2018,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/d/d9/Hereditary.png&w=480',
        overall_score: 8.7,
        verdict: 'Modern Classic',
        genre: 'Psychological Horror'
      },
      {
        id: 'wiki_The_Shining_(film)',
        title: 'The Shining',
        media_type: 'movie',
        release_year: 1980,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/1/1d/The_Shining_%281980%29_U.K._release_poster_-_The_tide_of_terror_that_swept_America_IS_HERE.jpg&w=480',
        overall_score: 9.1,
        verdict: 'Masterpiece',
        genre: 'Psychological Thriller'
      },
      {
        id: 'wiki_Black_Swan_(film)',
        title: 'Black Swan',
        media_type: 'movie',
        release_year: 2010,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/6/68/Black_Swan_poster.jpg&w=480',
        overall_score: 8.8,
        verdict: 'Acclaimed',
        genre: 'Psychological Horror'
      },
      {
        id: 'wiki_Get_Out',
        title: 'Get Out',
        media_type: 'movie',
        release_year: 2017,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/a/a3/Get_Out_poster.png&w=480',
        overall_score: 8.8,
        verdict: 'Oscar Winner',
        genre: 'Social Thriller'
      },
      {
        id: 'wiki_Shutter_Island_(film)',
        title: 'Shutter Island',
        media_type: 'movie',
        release_year: 2010,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/7/76/Shutterislandposter.jpg&w=480',
        overall_score: 8.7,
        verdict: 'Cult Favorite',
        genre: 'Mystery • Noir'
      },
      {
        id: 'wiki_The_Silence_of_the_Lambs_(film)',
        title: 'The Silence of the Lambs',
        media_type: 'movie',
        release_year: 1991,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg&w=480',
        overall_score: 9.2,
        verdict: 'Legendary',
        genre: 'Psychological Thriller'
      }
    ]
  },
  {
    id: 'underrated-gems',
    title: '💎 Underrated Masterpieces & Hidden Gems',
    badge: 'AUDIENCE FAVORITES',
    tagline: 'Overwhelming positive reception with less mainstream saturation — pure cinematic gems.',
    items: [
      {
        id: 'wiki_Coherence_(film)',
        title: 'Coherence',
        media_type: 'movie',
        release_year: 2013,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/9/9d/Coherence_2013_theatrical_poster.jpg&w=480',
        overall_score: 8.6,
        verdict: 'Hidden Gem',
        genre: 'Sci-Fi Mystery'
      },
      {
        id: 'wiki_Dark_(TV_series)',
        title: 'Dark',
        media_type: 'series',
        release_year: 2017,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/504/1262352.jpg',
        overall_score: 9.2,
        verdict: 'Masterpiece',
        genre: 'Time Travel • Mystery'
      },
      {
        id: 'anilist_19',
        title: 'Monster',
        media_type: 'anime',
        release_year: 2004,
        poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19-gtMC64182sm4.jpg',
        overall_score: 9.1,
        verdict: 'Legendary Thriller',
        genre: 'Psychological • Mystery'
      },
      {
        id: 'wiki_Incendies',
        title: 'Incendies',
        media_type: 'movie',
        release_year: 2010,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/a/a0/Incendies.jpg&w=480',
        overall_score: 9.0,
        verdict: 'Emotional Tour-de-Force',
        genre: 'Mystery Drama'
      },
      {
        id: 'wiki_Primal_(TV_series)',
        title: 'Primal',
        media_type: 'series',
        release_year: 2019,
        poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/608/1521294.jpg',
        overall_score: 8.9,
        verdict: 'Visceral Masterpiece',
        genre: 'Action • Fantasy'
      },
      {
        id: 'wiki_Past_Lives_(film)',
        title: 'Past Lives',
        media_type: 'movie',
        release_year: 2023,
        poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/d/da/Past_Lives_film_poster.png&w=480',
        overall_score: 8.7,
        verdict: 'Poetic Acclaim',
        genre: 'Romance • Drama'
      }
    ]
  }
];
