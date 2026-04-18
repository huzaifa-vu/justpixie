
const extractVideoId = (url) => {
  const patterns = [
    /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[%#?&]|$)/,
    /(?:embed|v|shorts|live)\/([0-9A-Za-z_-]{11})(?:[%#?&]|$)/,
    /youtu\.be\/([0-9A-Za-z_-]{11})(?:[%#?&]|$)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const testUrls = [
  'https://www.youtube.com/shorts/mx9jd6nWiGc',
  'https://www.youtube.com/watch?v=ScMzIvxBSi4',
  'https://youtu.be/ScMzIvxBSi4',
  'https://www.youtube.com/live/mx9jd6nWiGc?feature=share',
  'https://www.youtube.com/embed/ScMzIvxBSi4',
  'youtube.com/v/ScMzIvxBSi4'
];

testUrls.forEach(url => {
  console.log(`URL: ${url} -> ID: ${extractVideoId(url)}`);
});
