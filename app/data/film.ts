// The film and brand storytelling work, kept as background on the About page.
// Extracted from the old site's hand-coded iframes. Ids only; the embed
// component builds the URL and loads the player on click.
export interface Video {
  provider: "vimeo" | "youtube";
  id: string;
  title?: string;
}
export interface Series {
  key: string;
  title: string;
  client: string;
  logo: string;
  description: string;
  videos: Video[];
}

export const reel: Video = { provider: "vimeo", id: "387499815", title: "Director's reel" };

export const musicVideos: Video[] = [
  { provider: "vimeo", id: "391381431", title: "Prism Prize, Leo Award and WCMA winner" },
  { provider: "vimeo", id: "391382654", title: "Juno Award nominee" },
  { provider: "vimeo", id: "443937034", title: "LFM, AM Moonlight" },
  { provider: "vimeo", id: "391380474", title: "Rake Shark, Wake Up" },
  { provider: "vimeo", id: "487905741" },
  { provider: "vimeo", id: "391379139" },
  { provider: "vimeo", id: "479436075" },
  { provider: "vimeo", id: "391376580" },
  { provider: "vimeo", id: "954286474" },
];

export const documentaries: Video[] = [
  { provider: "vimeo", id: "880652226", title: "The Club Penguin Story (in development)" },
  { provider: "vimeo", id: "1125706929", title: "Most Likely to Become Famous (in post)" },
];

export const series: Series[] = [
  {
    key: "lego",
    title: "Build Your Own Adventure",
    client: "LEGO Group",
    logo: "/static/logos/logo-lego.png",
    description:
      "Two seasons of interactive storytelling on LEGO Life. Kids voted on curated brick piles and submitted builds to advance the story. The series prototyped custom UGC features for the platform, and it is where the idea behind Remoose came from.",
    videos: [
      { provider: "vimeo", id: "701158926" },
      { provider: "vimeo", id: "703481238" },
      { provider: "vimeo", id: "706005610" },
      { provider: "vimeo", id: "708561443" },
    ],
  },
  {
    key: "clubpenguin",
    title: "Club Penguin",
    client: "Disney Interactive",
    logo: "/static/logos/logo-disney.png",
    description:
      "Known to the community as Businesmoose, I was the in-game face of Club Penguin: sneak peeks, event announcements, exclusive content. Over 14 million views on the channel, plus TV spots that aired on Cartoon Network and Nickelodeon.",
    videos: [
      { provider: "youtube", id: "OGDXggAQtHs" },
      { provider: "youtube", id: "ZhiI33kqpDM" },
      { provider: "youtube", id: "7xar-hAwIM4" },
      { provider: "youtube", id: "DS4aaWdQGpU" },
    ],
  },
  {
    key: "brainwaves",
    title: "Brain Waves",
    client: "Ocean Wise",
    logo: "/static/logos/logo-oceanwise.png",
    description:
      "An educational YouTube series for Ocean Wise and the Vancouver Aquarium, made with the marine scientists, teaching kids about ocean science and conservation.",
    videos: [
      { provider: "youtube", id: "cEFN7NadTmc" },
      { provider: "youtube", id: "PzURXrrjTKY" },
      { provider: "youtube", id: "ucES9tc5yIM" },
    ],
  },
  {
    key: "oceankitchen",
    title: "Ocean Kitchen",
    client: "Ocean Wise Seafood",
    logo: "/static/logos/logo-oceanwise.png",
    description:
      "A cooking series with chef Ned Bell promoting sustainable seafood, culinary entertainment carrying a conservation message.",
    videos: [
      { provider: "youtube", id: "yGwrGkqxmBo" },
      { provider: "youtube", id: "Ajuydxqjc1c" },
      { provider: "youtube", id: "TkRNrZTxYcc" },
      { provider: "youtube", id: "W8VUC_1kW0Y" },
    ],
  },
  {
    key: "oceanexplainers",
    title: "Ocean Explainers",
    client: "Ocean Wise",
    logo: "/static/logos/logo-oceanwise.png",
    description: "Short explainers on marine conservation topics for the public.",
    videos: [
      { provider: "youtube", id: "nkXthUsnRz4" },
      { provider: "youtube", id: "MIMuPW4Lebg" },
      { provider: "youtube", id: "K1enBZghnoA" },
    ],
  },
  {
    key: "hippo",
    title: "Studio Insights",
    client: "Hyper Hippo",
    logo: "/static/logos/logo-hippo.png",
    description:
      "A community series of developer Q&As and studio insights, giving the gaming community a window into how the games got made.",
    videos: [
      { provider: "youtube", id: "GHWmSxO5EIE" },
      { provider: "youtube", id: "mponBHQckuA" },
      { provider: "youtube", id: "OvAFE9VtwzY" },
    ],
  },
  {
    key: "wishbone-campaign",
    title: "Landscape Architect Profiles",
    client: "Wishbone Site Furnishings",
    logo: "/static/logos/logo-wishbone.png",
    description:
      "Print ads in Landscape Architect Magazine carried QR codes to video profiles celebrating the architects, with Wishbone products throughout their projects. The campaign that preceded the platform.",
    videos: [
      { provider: "youtube", id: "oopMUokWKD8" },
      { provider: "youtube", id: "DKAlOmkSlSE" },
      { provider: "youtube", id: "Z3BdwuZTOJc" },
    ],
  },
  {
    key: "brandvideos",
    title: "Brand Videos and Trailers",
    client: "Various",
    logo: "/static/logos/logo-vanaqua.png",
    description:
      "Promotional videos for the Vancouver Aquarium, stop-motion game trailers, virtual world beta announcements, and television commercials for Disney properties.",
    videos: [
      { provider: "youtube", id: "Ho12PaeLcRI" },
      { provider: "youtube", id: "e7z6fpcI-1w" },
      { provider: "youtube", id: "z6981TrLFd0" },
      { provider: "youtube", id: "VhLlFF17GA0" },
      { provider: "youtube", id: "JStdx_NO0-g" },
      { provider: "youtube", id: "FejHJ9IUubU" },
      { provider: "youtube", id: "xcQj69PRhlw" },
    ],
  },
];

export const clientLogos = [
  { name: "Disney", src: "/static/logos/logo-disney.png" },
  { name: "LEGO Group", src: "/static/logos/logo-lego.png" },
  { name: "Ocean Wise", src: "/static/logos/logo-oceanwise.png" },
  { name: "Vancouver Aquarium", src: "/static/logos/logo-vanaqua.png" },
  { name: "Hyper Hippo", src: "/static/logos/logo-hippo.png" },
  { name: "RocketSnail Games", src: "/static/logos/logo-rocketsnail.png" },
  { name: "Blumhouse Productions", src: "/static/logos/logo-blumhouse.png" },
  { name: "604 Records", src: "/static/logos/logo-604.png" },
  { name: "Light Organ Records", src: "/static/logos/logo-lightorgan.png" },
  { name: "Wishbone Site Furnishings", src: "/static/logos/logo-wishbone.png" },
];

export const awards = [
  "Juno Award nominee, Best Music Video (2020)",
  "Leo Award, Best Music Video (2019)",
  "WCMA Video Director of the Year (2019)",
  "Prism Prize Audience Choice Award (2019)",
];
