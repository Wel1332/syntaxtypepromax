/**
 * Simple asset loader. Put your files under public/assets/... or update paths.
 * Usage:
 *   const assets = await loadAssets({ images: { ship: '/assets/ship.png' }, sounds: { pew: '/assets/pew.wav' }});
 */
export async function loadAssets({ images = {}, sounds = {} } = {}) {
  const loadImage = (src) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

  const loadAudio = (src) =>
    new Promise((res, rej) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => res(audio);
      audio.onerror = rej;
      audio.src = src;
      audio.load();
    });

  const imageEntries = Object.entries(images).map(([k, v]) =>
    loadImage(v).then((img) => [k, img])
  );
  const soundEntries = Object.entries(sounds).map(([k, v]) =>
    loadAudio(v).then((au) => [k, au])
  );

  const loaded = await Promise.all([...imageEntries, ...soundEntries]);
  return Object.fromEntries(loaded);
}