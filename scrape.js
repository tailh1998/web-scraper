import puppeteer from 'puppeteer';
import fs from 'fs';

// Get the target URL from the command line arguments
const targetUrl = process.argv[2] ?? "https://anhdangcode.com/";

if (!targetUrl) {
  console.error('Please provide a target URL as an argument.');
  process.exit(1);
}

const scrapeMedia = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // scroll through the page
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Extract media elements (images and videos)
    const media = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img')).map((img) => ({
        type: 'image',
        src: img.src,
        srcset: img.srcset,
        alt: img.alt || 'No alt text',
      }));

      const videos = Array.from(document.querySelectorAll('video')).map((video) => ({
        type: 'video',
        src: video.src || video.querySelector('source')?.src,
        controls: video.hasAttribute('controls'),
        autoplay: video.hasAttribute('autoplay'),
      }));

      const audios = Array.from(document.querySelectorAll('audio')).map((audio) => ({
        type: 'audio',
        src: audio.src || audio.getAttribute('data-src'),
        id: audio.id || 'No ID',
      }));

      return [...images, ...videos, ...audios];
    });

    // Save the media data to a JSON file
    fs.writeFileSync('media.json', JSON.stringify(media, null, 2));

    console.log('Media data saved to media.json');
  } catch (error) {
    console.error('Error scraping the page:', error);
  } finally {
    await browser.close();
  }
};

scrapeMedia();
